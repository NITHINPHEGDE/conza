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

  createProject: async ({ name, description, attachments }) => {
    const res = await api.post('/projects', { name, description, attachments });
    return res.data;
  },

  updateProject: async (id, data) => {
    const res = await api.patch(`/projects/${id}`, data);
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

  deleteProject: async (id) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
};
