import api from './axiosInstance';

export const complaintAPI = {
  reportIssue: async ({ subject, description, type }) => {
    const res = await api.post('/complaints', { subject, description, type });
    return res.data;
  },

  getMyComplaints: async () => {
    const res = await api.get('/complaints/my');
    return res.data;
  },

  getComplaintById: async (id) => {
    const res = await api.get(`/complaints/${id}`);
    return res.data;
  },
};
