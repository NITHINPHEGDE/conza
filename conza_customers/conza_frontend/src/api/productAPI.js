import api from './axiosInstance';

export const productAPI = {
  // Admin-managed material categories (title + image) for the Materials filter
  getMaterialCategories: async () => {
    const res = await api.get('/products/categories/materials');
    return res.data;
  },

  // Admin-managed rental categories (title + image) for the Rentals filter
  getRentalCategories: async () => {
    const res = await api.get('/products/categories/rentals');
    return res.data;
  },
};
