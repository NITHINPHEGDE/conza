// conzavf/src/services/categoryService.js
// Fetches admin-managed categories from the shared customer backend.
// The endpoints are public (no auth required).

import { BASE_URL } from './apiClient';

const fetchJSON = async (url) => {
  const res  = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
};

export const categoryService = {
  /** Returns admin-defined material categories (active only). */
  getMaterialCategories: () =>
    fetchJSON(`${BASE_URL}/products/categories/materials`)
      .then((d) => d.categories || [])
      .catch(() => []),

  /** Returns admin-defined rental/equipment categories (active only). */
  getRentalCategories: () =>
    fetchJSON(`${BASE_URL}/products/categories/rentals`)
      .then((d) => d.categories || [])
      .catch(() => []),
};
