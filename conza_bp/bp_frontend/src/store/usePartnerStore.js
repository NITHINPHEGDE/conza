// src/store/usePartnerStore.js
import { create } from 'zustand';
import { toggleOnlineAPI } from '../services/workerService';
import { startLocationTracking, stopLocationTracking } from '../services/locationService';

const usePartnerStore = create((set, get) => ({
  // ── Auth / Profile ─────────────────────────────────────────────────────
  worker: null,          // populated after login / getMe

  setWorker: (worker) => set({ worker }),

  clearWorker: () => set({ worker: null, isOnline: false }),

  // ── Stats (derived from worker or local session totals) ────────────────
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

      // Sync into worker object too
      set((state) => ({
        worker: state.worker ? { ...state.worker, isOnline: data.isOnline } : state.worker,
      }));
    } catch (err) {
      console.error('[Store] toggleOnline failed:', err.message);
      throw err;
    }
  },

  // Called after login / app boot to sync server isOnline state
  syncOnlineState: (isOnline) => {
    set({ isOnline });
    if (isOnline) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  },

  // ── Requests (Fetched from backend) ──────────────────────────────────
  requests: [],
  
  fetchRequests: async () => {
    try {
      const { api } = require('../services/apiClient');
      const data = await api.get('/bookings/requests');
      if (data.success) {
        // Map backend booking to the shape the UI expects
        const mapped = data.requests.map(r => ({
          id:               r._id,
          userName:         r.userName || 'Client',
          location:         `${r.city}, ${r.area}`,
          area:             r.area,
          distance:         'Nearby',
          timeAway:         '15 mins',
          estimatedAmount:  r.total,
          service:          r.category,
          subService:       'General',
          ...r
        }));
        set({ requests: mapped });
      }
    } catch (err) {
      console.error('[Store] fetchRequests failed:', err.message);
    }
  },

  updateRequestStatus: async (requestId, status) => {
    try {
      const { api } = require('../services/apiClient');
      await api.patch(`/bookings/${requestId}/status`, { status });
      // If accepted, move to activeJob locally too (though next poll would handle it)
      if (status === 'confirmed') {
        const req = get().requests.find(r => r.id === requestId);
        if (req) get().acceptJob(req);
      }
      // Refresh list
      await get().fetchRequests();
    } catch (err) {
      console.error('[Store] updateRequestStatus failed:', err.message);
    }
  },

  setRequests: (requests) => set({ requests }),

  // ── History ────────────────────────────────────────────────────────────
  history: [],
  setHistory: (history) => set({ history }),

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

  markArrived: () => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    set({ jobStatus: 'arrived', checkInTime: timeStr });
  },

  startWork: () => set({ jobStatus: 'in_progress' }),

  completeJob: () => set((state) => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const { activeJob, checkInTime, todaysJobs, todaysEarnings, history, requests } = state;

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
      checkIn:    checkInTime,
      checkOut:   timeStr,
      date:       'Today',
    };

    return {
      jobStatus:       'completed',
      checkOutTime:    timeStr,
      todaysJobs:      todaysJobs + 1,
      todaysEarnings:  todaysEarnings + activeJob.estimatedAmount,
      history:         [completedEntry, ...history],
      requests:        requests.filter((r) => r.id !== activeJob.id),
    };
  }),

  resetActiveJob: () => set({
    activeJob:   null,
    jobStatus:   null,
    checkInTime: null,
    checkOutTime: null,
  }),
}));

const EMPTY_OBJ = {};

// ── Selectors ──────────────────────────────────────────────────────────────
export const selectWorker          = (s) => s.worker;
export const selectProfile         = (s) => s.worker || EMPTY_OBJ;
export const selectIsOnline        = (s) => s.isOnline;
export const selectToggleOnline    = (s) => s.toggleOnline;
export const selectTodaysJobs      = (s) => s.todaysJobs;
export const selectTodaysEarnings  = (s) => s.todaysEarnings;
export const selectRating          = (s) => s.worker?.rating || 5.0;
export const selectRequests        = (s) => s.requests;
export const selectHistory         = (s) => s.history;
export const selectActiveJob       = (s) => s.activeJob;
export const selectJobStatus       = (s) => s.jobStatus;
export const selectCheckInTime     = (s) => s.checkInTime;
export const selectAcceptJob       = (s) => s.acceptJob;
export const selectDeclineJob      = (s) => s.declineJob;
export const selectMarkArrived     = (s) => s.markArrived;
export const selectStartWork       = (s) => s.startWork;
export const selectCompleteJob     = (s) => s.completeJob;
export const selectResetActiveJob  = (s) => s.resetActiveJob;

export default usePartnerStore;
