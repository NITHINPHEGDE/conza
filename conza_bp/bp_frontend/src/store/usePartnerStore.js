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
      setTimeout(() => {
        get().initSocketHandlers();
        socket.emit('join_worker', worker._id);
      }, 300);
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
            estimatedAmount: r.total || r.estimatedAmount || 0,
            service:         r.category  || r.service || 'Service',
            subService:      r.subService || 'General',
            description:     r.description || r.notes || 'No description provided',
            scheduledTime:    dateStr,
            scheduledDate:    r.scheduledDate || null,
            scheduledEndDate: r.scheduledEndDate || null,
            scheduledDates:   r.scheduledDates || [],
            totalDays:        r.totalDays || 1,
            isImmediate:      r.isImmediate !== false,
            isAutoBook:       r.isAutoBook || false,
            requiredWorkers:  r.requiredWorkers || 0,
            acceptedCount:    (r.workers || []).length,
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
    socket.off('new_auto_book_request');
    socket.off('job_request_removed');
    socket.off('connect');

    // Rejoin the worker's personal room on every (re)connect so Quick Auto
    // Book broadcasts/removals keep reaching this device.
    socket.on('connect', () => {
      const w = get().worker;
      if (w) socket.emit('join_worker', w._id);
    });

    socket.on('new_auto_book_request', (data) => {
      console.log('⚡ BP: New auto-book request:', data);
      get().fetchRequests();
    });

    socket.on('job_request_removed', (data) => {
      console.log('🗑️ BP: Auto-book request filled/removed:', data.bookingId);
      // Only remove if we are NOT the active worker on this job
      // (i.e. we haven't accepted it ourselves)
      if (get().activeJobId !== data.bookingId?.toString()) {
        set((state) => ({
          requests: state.requests.filter(
            (r) => r.id?.toString() !== data.bookingId?.toString()
          ),
        }));
      }
    });

    socket.on('booking_updated', (data) => {
      console.log('🔄 BP: Booking update received:', data);
      const workerId = get().worker?._id?.toString();

      // For auto-book: if status is non-pending, only remove the request card
      // for workers who did NOT claim a slot (i.e. not in the accepted set).
      // Workers who accepted should keep their active job unaffected.
      if (data.status && data.status !== 'pending') {
        const bookingSnapshot = data.bookingSnapshot;
        const isAutoBook = bookingSnapshot?.isAutoBook;
        if (isAutoBook && workerId) {
          const acceptedIds = (bookingSnapshot?.workers || []).map(id => id?.toString());
          const iAccepted = acceptedIds.includes(workerId);
          if (!iAccepted) {
            // Not our job — remove request card
            set((state) => ({
              requests: state.requests.filter(
                (r) => r.id?.toString() !== data.bookingId?.toString()
              ),
            }));
          }
          // If we did accept, our active job stays — do not remove
        } else {
          // Normal (non-auto) booking or no snapshot — old behaviour
          set((state) => ({
            requests: state.requests.filter(
              (r) => r.id?.toString() !== data.bookingId?.toString()
            ),
          }));
        }
      }

      get().fetchRequests();
      if (get().activeJobId === data.bookingId) {
        get().fetchActiveJob(data.bookingId);
      }
    });

    socket.on('booking_status_changed', (data) => {
      console.log('🔄 BP: Booking status changed:', data.status);
      if (get().activeJobId === data.bookingId) {
        // For auto-book, each worker runs their own independent workflow.
        // A status change caused by ANOTHER worker (e.g. they clicked "Start Work")
        // must NOT override THIS worker's current stage.
        // Rule: only update jobStatus if the new status is a natural FORWARD
        // progression from our current status, or if this booking is not auto-book.
        const currentStatus = get().jobStatus;
        const newStatus = data.status;
        const bookingSnapshot = data.bookingSnapshot;
        const isAutoBook = bookingSnapshot?.isAutoBook;
        const workerId = get().worker?._id?.toString();

        const shouldUpdate = (() => {
          if (!newStatus) return false;
          // Always apply terminal states (completed / cancelled) regardless
          if (['completed', 'cancelled'].includes(newStatus)) return true;
          // For non-auto-book, always apply
          if (!isAutoBook) return true;
          // For auto-book: only apply if the change can only have come from
          // THIS worker's own action (i.e. the current worker's status should
          // be behind the new status in the workflow, and the new status is a
          // valid next step from their current personal stage).
          const statusOrder = ['pending', 'accepted', 'arrived', 'in_progress', 'awaiting_customer_confirmation', 'completed'];
          const currentIdx = statusOrder.indexOf(currentStatus);
          const newIdx = statusOrder.indexOf(newStatus);
          // Only advance forward — never let another worker's action go backward or
          // jump us past stages we haven't gone through ourselves.
          // A status is 'ours' only if it's exactly one step ahead.
          return newIdx === currentIdx + 1;
        })();

        if (shouldUpdate && data.status) {
          set({ jobStatus: data.status });
        }
        if (data.status !== 'completed') {
          get().fetchActiveJob(data.bookingId);
        }
      }
    });

    socket.on('job_completed_confirmed', (data) => {
      console.log('🔄 BP: Job completion confirmed by customer:', data.bookingId);
      if (get().activeJobId === data.bookingId) {
        set({ jobStatus: 'completed' }); 
      }
    });

    socket.on('issue_reported', (data) => {
      console.log('🔄 BP: Issue reported by customer:', data.bookingId);
      if (get().activeJobId === data.bookingId) {
        get().fetchActiveJob(data.bookingId); 
        const { Alert } = require('react-native');
        Alert.alert('Issue Reported', 'The customer has reported an issue with the completed work. Please discuss with the customer or contact support.');
      }
    });
  },

  updateRequestStatus: async (requestId, status, extraData = {}) => {
    try {
      const { api } = require('../services/apiClient');
      const data = await api.patch(`/bookings/${requestId}/status`, { status, ...extraData });

      await stopAlertSound();
      stopNativeAlert();
      cancelLocalAlert(requestId);

      if (status === 'accepted') {
        await get().setActiveJobId(requestId);
        setTrackingMode(TRACKING_MODE.ACTIVE);   // worker is now en-route
      }
      if (status === 'cancelled' && get().activeJobId === requestId) {
        await get().setActiveJobId(null);
        setTrackingMode(TRACKING_MODE.IDLE);     // back to waiting
      }

      await get().fetchRequests();
      return data.booking;
    } catch (err) {
      console.error('[Store] updateRequestStatus failed:', err.message);
      // Auto-book slot was claimed by someone else first — drop it locally
      // instead of leaving a dead card in the list until the next poll.
      if (/already been filled/i.test(err.message || '')) {
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== requestId),
        }));
      }
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
    if (id) get().fetchActiveJob(id);
    else set({ activeJob: null });
  },

  fetchActiveJob: async (id) => {
    const bookingId = id || get().activeJobId;
    if (!bookingId) return;
    try {
      const { api } = require('../services/apiClient');
      const data = await api.get(`/bookings/${bookingId}`);
      if (data.success) {
        const r = data.booking;
        const workerId = get().worker?._id?.toString();

        // ── Determine the correct UI status for THIS worker ────────────────
        // For auto-book, each worker runs their own independent workflow.
        // The global booking status reflects whichever worker is furthest
        // along (or the last one who changed it). We must NOT let the global
        // status reset a worker who is personally further along.
        const statusOrder = ['pending', 'accepted', 'arrived', 'in_progress', 'awaiting_customer_confirmation', 'completed'];
        const currentPersonalStatus = get().jobStatus; // what THIS worker's UI currently shows
        const globalStatus = r.status;

        let uiStatus;
        if (r.isAutoBook && workerId) {
          const iAmAccepted = (r.workers || []).some(id => id?.toString() === workerId);

          if (!iAmAccepted) {
            // We haven't claimed a slot — not our active job anymore
            uiStatus = globalStatus;
          } else if (globalStatus === 'pending') {
            // Booking still collecting workers but WE accepted — show 'accepted'
            uiStatus = 'accepted';
          } else if (['cancelled', 'completed'].includes(globalStatus)) {
            // Terminal states always apply
            uiStatus = globalStatus;
          } else {
            // For in-flight statuses (arrived, in_progress, awaiting_customer_confirmation):
            // keep whichever is further along — personal or global.
            // This prevents another worker's action from resetting our workflow stage.
            const currentIdx  = statusOrder.indexOf(currentPersonalStatus);
            const globalIdx   = statusOrder.indexOf(globalStatus);
            uiStatus = currentIdx >= globalIdx ? currentPersonalStatus : globalStatus;
          }
        } else {
          // Non-auto-book: always use global status
          uiStatus = globalStatus;
        }

        const mapped = {
          ...r,
          id:              r._id,
          userName:        r.user?.fullName || 'Client',
          phone:           r.user?.phone    || 'N/A',
          location:        r.city ? `${r.city}, ${r.area || ''}` : 'Location N/A',
          address:         r.address || 'Address not provided',
          estimatedAmount: r.total || 0,
          service:         r.category || 'Service',
        };
        set({ activeJob: mapped, jobStatus: uiStatus });
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