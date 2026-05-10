import { create } from 'zustand';
import { partnerProfile, newRequests, historyData } from '../data/dummyData';

const usePartnerStore = create((set, get) => ({
  // ── Profile ────────────────────────────────────────────────────────
  profile: partnerProfile,

  // ── Stats ──────────────────────────────────────────────────────────
  todaysJobs: 2,
  todaysEarnings: 1550,
  rating: 4.8,
// ── Availability ───────────────────────────────────────────────────
  isOnline: true,
  toggleOnline: () => set((state) => ({ isOnline: !state.isOnline })),
  // ── Requests ───────────────────────────────────────────────────────
  requests: newRequests,

  // ── History ────────────────────────────────────────────────────────
  history: historyData,

  // ── Active Job ─────────────────────────────────────────────────────
  activeJob: null,
  jobStatus: null, // 'on_way' | 'arrived' | 'in_progress' | 'completed'
  checkInTime: null,
  checkOutTime: null,

  acceptJob: (request) => {
    set({
      activeJob: request,
      jobStatus: 'on_way',
      checkInTime: null,
      checkOutTime: null,
    });
  },

  declineJob: (requestId) => {
    set((state) => ({
      requests: state.requests.filter((r) => r.id !== requestId),
    }));
  },

  markArrived: () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    set({ jobStatus: 'arrived', checkInTime: timeStr });
  },

  startWork: () => {
    set({ jobStatus: 'in_progress' });
  },

  completeJob: () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const { activeJob, checkInTime, todaysJobs, todaysEarnings, history, requests } = get();

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

    set({
      jobStatus: 'completed',
      checkOutTime: timeStr,
      todaysJobs: todaysJobs + 1,
      todaysEarnings: todaysEarnings + activeJob.estimatedAmount,
      history: [completedEntry, ...history],
      requests: requests.filter((r) => r.id !== activeJob.id),
    });
  },

  resetActiveJob: () => {
    set({ activeJob: null, jobStatus: null, checkInTime: null, checkOutTime: null });
  },
}));

export default usePartnerStore;
