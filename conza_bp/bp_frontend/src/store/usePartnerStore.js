import { create } from 'zustand';
import { Alert } from 'react-native';
import { toggleOnlineAPI } from '../services/workerService';
import {
  startLocationTracking,
  stopLocationTracking,
  setTrackingMode,
  TRACKING_MODE,
  getCurrentCoords,
  getDistanceInMeters,
} from '../services/locationService';
import { socket, connectSocket } from '../utils/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  showJobNotification,
  scheduleJobNotification,
  startAlertSound,
  stopAlertSound,
  registerPushToken,
} from '../utils/notificationService';
import { scheduleLocalAlert, cancelLocalAlert } from '../utils/scheduledJobAlerts';
import { startNativeAlert, stopNativeAlert } from '../utils/nativeJobAlert';

const usePartnerStore = create((set, get) => ({
  // ── Auth / Profile ─────────────────────────────────────────────────────
  worker: null,

  setWorker: (worker) => {
    set({ worker });
    if (worker) {
      connectSocket();
      setTimeout(() => get().initSocketHandlers(), 300);
      // Workers are always online — start location tracking immediately on login
      setTimeout(() => startLocationTracking(), 500);

      setTimeout(async () => {
        try {
          const token = await registerPushToken();
          if (!token) {
            console.warn('[Push] No token returned from registerPushToken');
            return;
          }
          console.log('[Push] Saving token to backend:', token);
          const { api } = require('../services/apiClient');
          const result = await api.patch('/workers/push-token', { pushToken: token });
          console.log('[Push] Token save result:', result);
        } catch (err) {
          console.warn('[Push] Could not save token:', err.message);
        }
      }, 2000);
    }
  },

  clearWorker: () => {
    set({ worker: null, isOnline: false, activeJob: null, activeJobId: null });
    AsyncStorage.removeItem('activeJobId');
  },

  updateWorkerProfile: async (updates) => {
    const { updateProfileAPI } = require('../services/workerService');
    const data = await updateProfileAPI(updates);
    if (data.success && data.worker) {
      set({ worker: data.worker });
      const { saveSession } = require('../services/authService');
      const token = await AsyncStorage.getItem('conza_token');
      await saveSession(token, data.worker);
    }
    return data;
  },

  // ── Stats ──────────────────────────────────────────────────────────────
  todaysJobs:     0,
  todaysEarnings: 0,

  // ── Availability ───────────────────────────────────────────────────────
  isOnline: false,
  isTogglingOnline: false,
  toggleDirection: null, // 'going_online' | 'going_offline'

  toggleOnline: async () => {
    if (get().isTogglingOnline) return; // debounce double-taps
    set({ isTogglingOnline: true, toggleDirection: 'going_online' });
    try {
      const data = await toggleOnlineAPI();
      // Workers are always online — ignore server response if it says offline
      set({ isOnline: true });
      await startLocationTracking();
      set((state) => ({
        worker: state.worker ? { ...state.worker, isOnline: true } : state.worker,
      }));
    } catch (err) {
      console.error('[Store] toggleOnline failed:', err.message);
      throw err;
    } finally {
      set({ isTogglingOnline: false, toggleDirection: null });
    }
  },

  syncOnlineState: (isOnline) => {
    // Workers are always online — only allow going online, never offline
    set({ isOnline: true });
    startLocationTracking();
  },

  // ── Requests ───────────────────────────────────────────────────────────
  requests: [],
  requestsLoading: false,

  // `silent`: background polls (every 10s while online) pass silent=true so
  // they don't flip requestsLoading and don't replace the `requests` array
  // reference unless the data actually changed. Previously every poll set
  // requestsLoading true→false and always wrote a brand-new array, which
  // made the FlatList swap to its skeleton/empty state and re-render every
  // card every 10 seconds — the "flicker" even when nothing changed.
  fetchRequests: async (silent = false) => {
    if (!silent) set({ requestsLoading: true });
    try {
      const { api } = require('../services/apiClient');
      const data = await api.get('/bookings/requests');
      if (data.success) {
        const previousIds = new Set(get().requests.map(r => r.id?.toString()));

        const mapped = data.requests.map(r => {
          let dateStr = 'Immediate';
          if (!r.isImmediate && r.scheduledDate) {
            try {
              dateStr = new Date(r.scheduledDate).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              });
              if (r.totalDays > 1 && r.scheduledEndDate) {
                const endStr = new Date(r.scheduledEndDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short'
                });
                dateStr = `${dateStr} → ${endStr} (${r.totalDays} days)`;
              }
            } catch (e) {
              dateStr = 'Scheduled';
            }
          }

          const addrParts = [
            r.houseNumber ? `No. ${r.houseNumber}` : '',
            r.houseName   ? `${r.houseName}`        : '',
            r.street      ? `${r.street}`           : '',
            r.area        ? `${r.area}`              : '',
            r.city        ? `${r.city}`              : '',
            r.pincode     ? `(${r.pincode})`         : '',
          ].filter(p => p && p.trim().length > 0);

          const ownWorkerId = get().worker?._id?.toString();
          const ownEntry    = r.isAutobook
            ? (r.workerStatuses || []).find((w) => w.worker?.toString() === ownWorkerId)
            : null;
          const ownEstimatedAmount = ownEntry
            ? (Number(ownEntry.workerSnapshot?.pricePerDay) || 0)
            : (r.total || r.estimatedAmount || 0);

          return {
            ...r,
            id:              r._id,
            userName:        r.user?.fullName || r.user?.name || 'Client',
            phone:           r.user?.phone    || 'N/A',
            location:        r.city ? `${r.city}, ${r.area || ''}` : 'Location N/A',
            address:         addrParts.join(', ') || r.address || 'Address not provided',
            area:            r.area             || '',
            distance:        r.distance         || '2.5 km',
            timeAway:        r.timeAway         || 'Nearby',
            estimatedAmount: ownEstimatedAmount,
            service:         r.category  || r.service || 'Service',
            subService:      r.subService || 'General',
            description:     r.description || r.notes || 'No description provided',
            scheduledTime:    dateStr,
            scheduledDate:    r.scheduledDate || null,
            scheduledEndDate: r.scheduledEndDate || null,
            scheduledDates:   r.scheduledDates || [],
            totalDays:        r.totalDays || 1,
            isImmediate:      r.isImmediate !== false,
            isAutobook:       r.isAutobook || false,
            requiredWorkers:  r.requiredWorkers || 0,
            acceptedCount:    r.acceptedCount || 0,
          };
        });

        // Only replace the array reference if the set of request IDs (or
        // the count) actually changed — keeps FlatList/RequestCard
        // references stable across identical background polls.
        const nextIds = mapped.map(r => r.id?.toString()).join(',');
        const currentIds = get().requests.map(r => r.id?.toString()).join(',');
        if (nextIds !== currentIds) {
          set({ requests: mapped });
        }

        const workerIsOnline = get().isOnline;
        if (workerIsOnline) {
          mapped.forEach(async (req) => {
            const isNew = !previousIds.has(req.id?.toString());
            if (!isNew) return;

            if (req.isImmediate) {
              await showJobNotification(req);
              startNativeAlert(req);
            } else {
              await scheduleJobNotification(req);
              scheduleLocalAlert(req, async (scheduledReq) => {
                await showJobNotification(scheduledReq);
                await startAlertSound();
              });
            }
          });
        }
      }
    } catch (err) {
      console.error('[Store] fetchRequests failed:', err.message);
    } finally {
      if (!silent) set({ requestsLoading: false });
    }
  },

  initSocketHandlers: () => {
    socket.off('booking_updated');
    socket.off('booking_status_changed');
    socket.off('job_completed_confirmed');
    socket.off('issue_reported');
    socket.off('new_autobook_request');
    socket.off('autobook_request_closed');
    socket.off('worker_status_changed');
    socket.off('connect');

    // Join this worker's personal room so the customer backend can push
    // autobook requests straight to them, with zero polling latency.
    const ownWorkerId = get().worker?._id;
    if (ownWorkerId) socket.emit('join_worker', ownWorkerId.toString());

    socket.on('connect', () => {
      const wId = get().worker?._id;
      if (wId) socket.emit('join_worker', wId.toString());
      get().fetchRequests();

      // Reconnects (network blips, app background/foreground) drop room
      // membership server-side, including the per-booking `booking_${id}`
      // room used for status updates. Rejoin it and pull the authoritative
      // status so a worker never gets stuck on a stale local jobStatus.
      const jobId = get().activeJobId;
      if (jobId) get().fetchActiveJob(jobId);
    });

    socket.on('booking_updated', (data) => {
      console.log('🔄 BP: Booking update received:', data);
      if (data.status && data.status !== 'pending') {
        set((state) => ({
          requests: state.requests.filter(
            (r) => r.id?.toString() !== data.bookingId?.toString()
          ),
        }));
      }
      get().fetchRequests();
      if (get().activeJobId === data.bookingId) {
        get().fetchActiveJob(data.bookingId);
      }
    });

    socket.on('booking_status_changed', (data) => {
      console.log('🔄 BP: Booking status changed:', data.status);
      const ownId = get().worker?._id?.toString();

      // Autobook events carry a workerId — only apply directly to this
      // worker's jobStatus when it's THEIR own entry that changed. Generic
      // aggregate events (no workerId) for an autobook booking are just a
      // signal to refresh, never to stomp jobStatus.
      if (data.isAutobook && data.workerId && data.workerId !== ownId) return;

      if (get().activeJobId === data.bookingId) {
        if (data.status && (!data.isAutobook || data.workerId === ownId)) {
          set({ jobStatus: data.status });
        }
        if (data.status !== 'completed') {
          get().fetchActiveJob(data.bookingId);
        }
      }
    });

    socket.on('worker_status_changed', (data) => {
      const ownId = get().worker?._id?.toString();
      if (data.workerId && data.workerId !== ownId) return;
      if (get().activeJobId === data.bookingId) {
        set({ jobStatus: data.status });
        // Skip fetchActiveJob on completion — status is already set and the
        // CompletionModal triggers immediately off jobStatus. A network call
        // here would add latency before the modal appears.
        if (data.status !== 'completed') {
          get().fetchActiveJob(data.bookingId);
        }
      }
    });

    socket.on('job_completed_confirmed', (data) => {
      console.log('🔄 BP: Job completion confirmed by customer:', data.bookingId);
      if (get().activeJobId === data.bookingId) {
        // Customer confirmed, now we can complete the job and ask for payment
        set({ jobStatus: 'completed' }); 
      }
    });

    socket.on('issue_reported', (data) => {
      console.log('🔄 BP: Issue reported by customer:', data.bookingId);
      if (get().activeJobId === data.bookingId) {
        get().fetchActiveJob(data.bookingId); // To get the issue report details
        const { Alert } = require('react-native');
        Alert.alert('Issue Reported', 'The customer has reported an issue with the completed work. Please discuss with the customer or contact support.');
      }
    });

    // ── Quick Auto Book: instant push, no waiting for the 10s poll ──────
    socket.on('new_autobook_request', () => {
      get().fetchRequests();
    });

    socket.on('autobook_request_closed', (data) => {
      set((state) => ({
        requests: state.requests.filter((r) => r.id?.toString() !== data.bookingId?.toString()),
      }));
      cancelLocalAlert(data.bookingId);
      stopNativeAlert();
    });
  },

  updateRequestStatus: async (requestId, status, extraData = {}) => {
    try {
      const { api } = require('../services/apiClient');
      await api.patch(`/bookings/${requestId}/status`, { status, ...extraData });

      await stopAlertSound();
      stopNativeAlert();
      cancelLocalAlert(requestId);

      if (status === 'accepted') {
        await get().setActiveJobId(requestId);
        setTrackingMode(TRACKING_MODE.ACTIVE);   // worker is now en-route
      } else if (status === 'cancelled' && get().activeJobId === requestId) {
        await get().setActiveJobId(null);
        setTrackingMode(TRACKING_MODE.IDLE);     // back to waiting
      } else if (get().activeJobId === requestId) {
        // Update local state immediately instead of waiting on a socket
        // round-trip — fixes "Work Completed" not reliably flipping the
        // UI to Awaiting Confirmation.
        set({ jobStatus: status });
      }

      await get().fetchRequests();
    } catch (err) {
      console.error('[Store] updateRequestStatus failed:', err.message);
    }
  },

  // ── Quick Auto Book: race-safe accept ────────────────────────────────
  acceptAutobookRequest: async (requestId) => {
    const { api } = require('../services/apiClient');
    try {
      await api.patch(`/bookings/${requestId}/accept`);

      await stopAlertSound();
      stopNativeAlert();
      cancelLocalAlert(requestId);

      await get().setActiveJobId(requestId);
      setTrackingMode(TRACKING_MODE.ACTIVE);
      await get().fetchRequests();
    } catch (err) {
      // Someone else likely filled the slot first — drop it from the local
      // list immediately and let the caller show the message.
      set((state) => ({
        requests: state.requests.filter((r) => r.id?.toString() !== requestId?.toString()),
      }));
      throw err;
    }
  },

  setRequests: (requests) => set({ requests }),

  // ── History ────────────────────────────────────────────────────────────
  history: [],
  setHistory: (history) => set({ history }),

  fetchHistory: async () => {
    try {
      const { api } = require('../services/apiClient');
      const data = await api.get('/bookings/history');
      if (data.success) {
        const mapped = data.history.map(h => {
          const fmtTime = (date) => date
            ? new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : '—';
          const addrParts = [
              h.houseNumber ? `No. ${h.houseNumber}` : '',
              h.houseName   || '',
              h.street      || '',
              h.area        || '',
              h.city        || '',
              h.pincode     ? `(${h.pincode})` : '',
            ].filter(p => p && p.trim().length > 0);

          return {
            ...h,
            id:            h._id,
            userName:      h.user?.fullName || 'Client',
            location:      h.city ? `${h.city}, ${h.area || ''}` : 'Location N/A',
            address:       addrParts.join(', ') || h.address || '',
            amount:        h.total || 0,
            service:       h.category || 'Service',
            subService:    h.subService || 'General',
            checkIn:       fmtTime(h.checkInTime),
            checkOut:      fmtTime(h.checkOutTime),
            date:          new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            updatedAt:     h.updatedAt || h.createdAt,
            distance:      h.distance || '—',
            paymentMethod: h.paymentMethod || 'cod',
            status:        h.status,
          };
        });
        set({ history: mapped });
      }
    } catch (err) {
      console.error('[Store] fetchHistory failed:', err.message);
    }
  },

  // ── Active Job ─────────────────────────────────────────────────────────
  activeJob:    null,
  jobStatus:    null,
  checkInTime:  null,
  checkOutTime: null,

  acceptJob: (request) => set({
    activeJob:    request,
    jobStatus:    'on_way',
    checkInTime:  null,
    checkOutTime: null,
  }),

  declineJob: (requestId) => set((state) => ({
    requests: state.requests.filter((r) => r.id !== requestId),
  })),

  markArrived: async () => {
    const { activeJob } = get();
    if (!activeJob) return;

    try {
      const coords = await getCurrentCoords();
      if (!coords) {
        Alert.alert('Location Required', 'Please enable location permission to mark yourself as arrived.');
        return;
      }

      // Client-side pre-check so the worker gets instant feedback without
      // waiting on the network — the server re-checks this authoritatively.
      if (activeJob.latitude != null && activeJob.longitude != null) {
        const distance = getDistanceInMeters(
          coords.latitude, coords.longitude,
          activeJob.latitude, activeJob.longitude
        );
        if (distance > 50) {
          Alert.alert(
            'Too Far From Customer',
            `You're about ${Math.round(distance)}m away from the customer's location. You need to be within 50m to mark yourself as arrived.`
          );
          return;
        }
      }

      const { api } = require('../services/apiClient');
      await api.patch(`/bookings/${activeJob.id}/status`, {
        status: 'arrived',
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      await stopAlertSound();
      stopNativeAlert();
      cancelLocalAlert(activeJob.id);

      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      set({ jobStatus: 'arrived', checkInTime: timeStr });
      setTrackingMode(TRACKING_MODE.ACTIVE);  // still on-site, keep high-frequency
      await get().fetchRequests();
    } catch (err) {
      console.error('[Store] markArrived failed:', err.message);
      Alert.alert('Unable to Mark as Arrived', err.message || 'Something went wrong. Please try again.');
    }
  },

  startWork: async () => {
    const { activeJob, updateRequestStatus } = get();
    if (!activeJob) return;
    await updateRequestStatus(activeJob.id, 'in_progress');
    set({ jobStatus: 'in_progress' });
    setTrackingMode(TRACKING_MODE.ACTIVE);  // work started, stay high-frequency
  },

  completeJob: async (paymentMethod = 'cod') => {
    const { activeJob, todaysJobs, todaysEarnings, history, requests } = get();
    if (!activeJob) return;

    // Notice we do NOT call updateRequestStatus('completed') here anymore, 
    // because that's now done by the customer's confirmation.
    // We only process the local store updates for the completed job.

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    // paymentMethod is set by setLastPaymentMethod right after this completes
    const completedEntry = {
      id:            `hist_${Date.now()}`,
      userName:      activeJob.userName,
      location:      activeJob.location,
      area:          activeJob.area,
      distance:      activeJob.distance,
      timeAway:      activeJob.timeAway,
      amount:        activeJob.estimatedAmount,
      service:       activeJob.service,
      subService:    activeJob.subService,
      status:        'completed',
      checkIn:       get().checkInTime,
      checkOut:      timeStr,
      date:          'Today',
      paymentMethod: paymentMethod,
    };

    set({
      jobStatus:       'completed',
      checkOutTime:    timeStr,
      todaysJobs:      todaysJobs + 1,
      todaysEarnings:  todaysEarnings + activeJob.estimatedAmount,
      history:         [completedEntry, ...history],
      requests:        requests.filter((r) => r.id !== activeJob.id),
    });

    await AsyncStorage.removeItem('activeJobId');
    set({ activeJobId: null });
    setTrackingMode(TRACKING_MODE.IDLE);  // job done, back to waiting for next job
  },

lastPaymentMethod: null,

  setLastPaymentMethod: (method) => set({ lastPaymentMethod: method }),

  resetActiveJob: () => {
    set({
      activeJob:         null,
      activeJobId:       null,
      jobStatus:         null,
      checkInTime:       null,
      checkOutTime:      null,
      lastPaymentMethod: null,
    });
    AsyncStorage.removeItem('activeJobId');
    setTrackingMode(TRACKING_MODE.IDLE);  // guard: ensure mode resets on any job reset
  },

  activeJobId: null,

  setActiveJobId: async (id) => {
    if (id) {
      await AsyncStorage.setItem('activeJobId', id);
    } else {
      await AsyncStorage.removeItem('activeJobId');
    }
    set({ activeJobId: id });
    if (id) {
      // Await this so callers (accept flow, boot-time restore) don't
      // navigate to the Active Job screen before `activeJob` is populated.
      await get().fetchActiveJob(id);
    } else {
      set({ activeJob: null });
    }
  },

  fetchActiveJob: async (id) => {
    const bookingId = id || get().activeJobId;
    if (!bookingId) return;
    try {
      const { api } = require('../services/apiClient');
      const data = await api.get(`/bookings/${bookingId}`);
      if (data.success) {
        const r = data.booking;
        const ownWorkerId = get().worker?._id?.toString();
        const ownEntry = r.isAutobook
          ? (r.workerStatuses || []).find((w) => w.worker?.toString() === ownWorkerId)
          : null;

        const mapped = {
          ...r,
          id:              r._id,
          userName:        r.user?.fullName || 'Client',
          phone:           r.user?.phone    || 'N/A',
          location:        r.city ? `${r.city}, ${r.area || ''}` : 'Location N/A',
          address:         r.address || 'Address not provided',
          estimatedAmount: ownEntry ? (ownEntry.total || Number(ownEntry.workerSnapshot?.pricePerDay) || 0) : (r.total || 0),
          service:         r.category || 'Service',
        };
        set({
          activeJob: mapped,
          jobStatus: ownEntry ? ownEntry.status : r.status,
          checkInTime: ownEntry?.checkInTime
            ? new Date(ownEntry.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : get().checkInTime,
        });
        socket.emit('join_booking', bookingId);
      }
    } catch (err) {
      console.error('Failed to fetch active job:', err.message);
    }
  },

  bootstrapSocket: () => {
    connectSocket();
    setTimeout(() => get().initSocketHandlers(), 500);
  },
}));

const EMPTY_OBJ = {};

export const selectWorker         = (s) => s.worker;
export const selectProfile        = (s) => s.worker || EMPTY_OBJ;
export const selectIsOnline       = (s) => s.isOnline;
export const selectIsTogglingOnline = (s) => s.isTogglingOnline;
export const selectToggleDirection  = (s) => s.toggleDirection;
export const selectToggleOnline   = (s) => s.toggleOnline;
export const selectTodaysJobs     = (s) => s.todaysJobs;
export const selectTodaysEarnings = (s) => s.todaysEarnings;
export const selectRating               = (s) => s.worker?.rating || 5.0;
export const selectUpdateWorkerProfile  = (s) => s.updateWorkerProfile;
export const selectRequests       = (s) => s.requests;
export const selectRequestsLoading = (s) => s.requestsLoading;
export const selectHistory        = (s) => s.history;
export const selectFetchHistory   = (s) => s.fetchHistory;
export const selectActiveJob      = (s) => s.activeJob;
export const selectJobStatus      = (s) => s.jobStatus;
export const selectCheckInTime    = (s) => s.checkInTime;
export const selectAcceptJob      = (s) => s.acceptJob;
export const selectDeclineJob     = (s) => s.declineJob;
export const selectMarkArrived    = (s) => s.markArrived;
export const selectStartWork      = (s) => s.startWork;
export const selectCompleteJob    = (s) => s.completeJob;
export const selectResetActiveJob = (s) => s.resetActiveJob;

export default usePartnerStore;