import api from './axiosInstance';

export const bookingAPI = {
  createBooking: async (data) => {
    const res = await api.post('/bookings', data);
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
};