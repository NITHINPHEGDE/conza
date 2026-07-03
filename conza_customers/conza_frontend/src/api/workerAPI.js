import api from './axiosInstance';

export const workerAPI = {
  getCategories: async ({ lat, lng } = {}) => {
    const params = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
    const res = await api.get(`/workers/categories${params}`);
    return res.data;
  },

  getNearbyWorkers: async ({ category, lat, lng, radius }) => {
    // radius is optional — when omitted, the backend uses the category's own
    // admin-configured service radius instead of a fixed default.
    const res = await api.get('/workers/nearby', {
      params: { category, lat, lng, ...(radius ? { radius } : {}) },
    });
    return res.data;
  },

  searchWorkers: async ({ q, lat, lng }) => {
    const res = await api.get('/workers/search', {
      params: { q, lat, lng },
    });
    return res.data;
  },
};