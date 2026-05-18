import { create } from 'zustand';
import { toggleOnlineAPI } from '../services/workerService';
import { startLocationTracking, stopLocationTracking } from '../services/locationService';
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

  // ── Stats ──────────────────────────────────────────────────────────────
  todaysJobs:     0,
  todaysEarnings: 0,

  // ── Availability ───────────────────────────────────────────────────────
  isOnline: false,

  toggleOnline: async () => {
    try {
      const data = await toggleOnlineAPI();
      set({ isOnline: data.isOnline });
      if (data.isOnline) {
        await startLocationTracking();
      } else {
        stopLocationTracking();
      }
      set((state) => ({
        worker: state.worker ? { ...state.worker, isOnline: data.isOnline } : state.worker,
      }));
    } catch (err) {
      console.error('[Store] toggleOnline failed:', err.message);
      throw err;
    }
  },

  syncOnlineState: (isOnline) => {
    set({ isOnline });
    if (isOnline) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  },

  // ── Requests ───────────────────────────────────────────────────────────
  requests: [],

  fetchRequests: async () => {
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
            scheduledTime:   dateStr,
            scheduledDate:   r.scheduledDate || null,
            isImmediate:     r.isImmediate !== false,
          };
        });

        set({ requests: mapped });

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
    }
  },

  initSocketHandlers: () => {
    socket.off('booking_updated');
    socket.off('booking_status_changed');

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
      if (get().activeJobId === data.bookingId) {
        get().fetchActiveJob(data.bookingId);
      }
    });
  },

  updateRequestStatus: async (requestId, status) => {
    try {
      const { api } = require('../services/apiClient');
      await api.patch(`/bookings/${requestId}/status`, { status });

      await stopAlertSound();
      stopNativeAlert();
      cancelLocalAlert(requestId);

      if (status === 'accepted') {
        await get().setActiveJobId(requestId);
      }
      if (status === 'cancelled' && get().activeJobId === requestId) {
        await get().setActiveJobId(null);
      }

      await get().fetchRequests();
    } catch (err) {
      console.error('[Store] updateRequestStatus failed:', err.message);
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
          return {
            ...h,
            id:         h._id,
            userName:   h.user?.fullName || 'Client',
            location:   h.city ? `${h.city}, ${h.area || ''}` : 'Location N/A',
            amount:     h.total || 0,
            service:    h.category || 'Service',
            subService: h.subService || 'General',
            checkIn:    fmtTime(h.checkInTime),
            checkOut:   fmtTime(h.checkOutTime),
            date:       new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            distance:   h.distance || '—',
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
    const { activeJob, updateRequestStatus } = get();
    if (!activeJob) return;
    await updateRequestStatus(activeJob.id, 'arrived');
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    set({ jobStatus: 'arrived', checkInTime: timeStr });
  },

  startWork: async () => {
    const { activeJob, updateRequestStatus } = get();
    if (!activeJob) return;
    await updateRequestStatus(activeJob.id, 'in_progress');
    set({ jobStatus: 'in_progress' });
  },

  completeJob: async () => {
    const { activeJob, updateRequestStatus, todaysJobs, todaysEarnings, history, requests } = get();
    if (!activeJob) return;

    await updateRequestStatus(activeJob.id, 'completed');

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const completedEntry = {
      id:         `hist_${Date.now()}`,
      userName:   activeJob.userName,
      location:   activeJob.location,
      area:       activeJob.area,
      distance:   activeJob.distance,
      timeAway:   activeJob.timeAway,
      amount:     activeJob.estimatedAmount,
      service:    activeJob.service,
      subService: activeJob.subService,
      status:     'completed',
      checkIn:    get().checkInTime,
      checkOut:   timeStr,
      date:       'Today',
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
  },

  resetActiveJob: () => {
    set({
      activeJob:    null,
      activeJobId:  null,
      jobStatus:    null,
      checkInTime:  null,
      checkOutTime: null,
    });
    AsyncStorage.removeItem('activeJobId');
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
        set({ activeJob: mapped, jobStatus: r.status });
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
export const selectToggleOnline   = (s) => s.toggleOnline;
export const selectTodaysJobs     = (s) => s.todaysJobs;
export const selectTodaysEarnings = (s) => s.todaysEarnings;
export const selectRating         = (s) => s.worker?.rating || 5.0;
export const selectRequests       = (s) => s.requests;
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