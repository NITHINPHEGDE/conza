// conzavf/src/services/categoryService.js
// Fetches admin-managed categories from the shared customer backend.
// These endpoints are public (no auth required).
//
// The URL is configured via EXPO_PUBLIC_CUSTOMER_API_URL in .env
// (different from this app's seller backend URL).

const CUSTOMER_API_URL = process.env.EXPO_PUBLIC_CUSTOMER_API_URL;

const fetchJSON = async (url) => {
  const res  = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
};

export const categoryService = {
  /** Returns admin-defined material categories (active only). */
  getMaterialCategories: () =>
    fetchJSON(`${CUSTOMER_API_URL}/products/categories/materials`)
      .then((d) => d.categories || [])
      .catch(() => []),

  /** Returns admin-defined rental/equipment categories (active only). */
  getRentalCategories: () =>
    fetchJSON(`${CUSTOMER_API_URL}/products/categories/rentals`)
      .then((d) => d.categories || [])
      .catch(() => []),
};
