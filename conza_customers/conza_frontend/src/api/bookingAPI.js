import api from './axiosInstance';

export const bookingAPI = {
  // ── Labour bookings (unchanged) ─────────────────────────────────────────
  createBooking: async (data) => {
    const res = await api.post('/bookings', data);
    return res.data;
  },

  // ── Quick Auto Book ──────────────────────────────────────────────────────
  createAutoBooking: async (data) => {
    const res = await api.post('/bookings/auto', data);
    return res.data;
  },

  getMyBookings: async () => {
    const res = await api.get('/bookings/my');
    return res.data;
  },

  getBookingById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  },

  cancelBooking: async (id) => {
    const res = await api.patch(`/bookings/${id}/cancel`);
    return res.data;
  },

  confirmCompletion: async (id) => {
    const res = await api.patch(`/bookings/${id}/confirm-completion`);
    return res.data;
  },

  reportIssue: async (id, comment) => {
    const res = await api.patch(`/bookings/${id}/report-issue`, { comment });
    return res.data;
  },

  // Partial auto-book: customer decides what to do when fewer workers accepted
  confirmPartialAutoBook: async (id) => {
    const res = await api.patch(`/bookings/${id}/partial-proceed`);
    return res.data;
  },

  cancelPartialAutoBook: async (id) => {
    const res = await api.patch(`/bookings/${id}/partial-cancel`);
    return res.data;
  },

  // ── Seller orders (material / rental) ──────────────────────────────────
  placeSellerOrder: async (data) => {
    const res = await api.post('/orders/seller', data);
    return res.data;
  },

  getMySellerOrders: async () => {
    const res = await api.get('/orders/seller/my');
    return res.data;
  },

  getSellerOrderById: async (id) => {
    const res = await api.get(`/orders/seller/${id}`);
    return res.data;
  },
};