import api from './axiosInstance';

export const projectAPI = {
  getAttachableItems: async () => {
    const res = await api.get('/projects/attachable-items');
    return res.data;
  },

  getMyProjects: async () => {
    const res = await api.get('/projects/my');
    return res.data;
  },

  getProjectById: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  createProject: async ({ name, description, budget, location, image, attachments }) => {
    const res = await api.post('/projects', { name, description, budget, location, image, attachments });
    return res.data;
  },

  updateProject: async (id, data) => {
    const res = await api.patch(`/projects/${id}`, data);
    return res.data;
  },

  addExpense: async (id, expenseData) => {
    const res = await api.post(`/projects/${id}/expenses`, expenseData);
    return res.data;
  },

  removeExpense: async (id, expenseId) => {
    const res = await api.delete(`/projects/${id}/expenses/${expenseId}`);
    return res.data;
  },

  addAttachment: async (id, attachment) => {
    const res = await api.patch(`/projects/${id}/attachments`, attachment);
    return res.data;
  },

  removeAttachment: async (id, attachmentId) => {
    const res = await api.delete(`/projects/${id}/attachments/${attachmentId}`);
    return res.data;
  },

  removeAttachments: async (id, attachmentIds) => {
    const res = await api.post(`/projects/${id}/attachments/bulk-delete`, { attachmentIds });
    return res.data;
  },

  deleteProject: async (id) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
};
