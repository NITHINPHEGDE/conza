// src/store/usePartnerStore.js
import { create } from 'zustand';
import { partnerProfile, newRequests, historyData } from '../data/dummyData';

const usePartnerStore = create((set) => ({
  // Profile
  profile: partnerProfile,

  // Stats
  todaysJobs: 2,
  todaysEarnings: 1550,
  rating: 4.8,

  // Availability
  isOnline: true,
  toggleOnline: () => set((state) => ({ isOnline: !state.isOnline })),

  // Requests
  requests: newRequests,

  // History
  history: historyData,

  // Active Job
  activeJob: null,
  jobStatus: null,
  checkInTime: null,
  checkOutTime: null,

  acceptJob: (request) => set({
    activeJob: request,
    jobStatus: 'on_way',
    checkInTime: null,
    checkOutTime: null,
  }),

  declineJob: (requestId) => set((state) => ({
    requests: state.requests.filter((r) => r.id !== requestId),
  })),

  markArrived: () => {
    const timeStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    set({ jobStatus: 'arrived', checkInTime: timeStr });
  },

  startWork: () => set({ jobStatus: 'in_progress' }),

  completeJob: () => set((state) => {
    const timeStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const { activeJob, checkInTime, todaysJobs, todaysEarnings, history, requests } = state;

    const completedEntry = {
      id: `hist_${Date.now()}`,
      userName: activeJob.userName,
      location: activeJob.location,
      area: activeJob.area,
      distance: activeJob.distance,
      timeAway: activeJob.timeAway,
      amount: activeJob.estimatedAmount,
      service: activeJob.service,
      subService: activeJob.subService,
      status: 'completed',
      checkIn: checkInTime,
      checkOut: timeStr,
      date: 'Today',
    };

    return {
      jobStatus: 'completed',
      checkOutTime: timeStr,
      todaysJobs: todaysJobs + 1,
      todaysEarnings: todaysEarnings + activeJob.estimatedAmount,
      history: [completedEntry, ...history],
      requests: requests.filter((r) => r.id !== activeJob.id),
    };
  }),

  resetActiveJob: () => set({
    activeJob: null,
    jobStatus: null,
    checkInTime: null,
    checkOutTime: null,
  }),
}));

// ── Selectors (use these in every component, never the raw hook) ──────────────
export const selectProfile       = (s) => s.profile;
export const selectIsOnline      = (s) => s.isOnline;
export const selectToggleOnline  = (s) => s.toggleOnline;
export const selectTodaysJobs    = (s) => s.todaysJobs;
export const selectTodaysEarnings= (s) => s.todaysEarnings;
export const selectRating        = (s) => s.rating;
export const selectRequests      = (s) => s.requests;
export const selectHistory       = (s) => s.history;
export const selectActiveJob     = (s) => s.activeJob;
export const selectJobStatus     = (s) => s.jobStatus;
export const selectCheckInTime   = (s) => s.checkInTime;
export const selectAcceptJob     = (s) => s.acceptJob;
export const selectDeclineJob    = (s) => s.declineJob;
export const selectMarkArrived   = (s) => s.markArrived;
export const selectStartWork     = (s) => s.startWork;
export const selectCompleteJob   = (s) => s.completeJob;
export const selectResetActiveJob= (s) => s.resetActiveJob;

export default usePartnerStore;