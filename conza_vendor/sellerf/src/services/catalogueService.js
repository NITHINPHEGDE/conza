// conzavf/src/services/catalogueService.js
import { api } from './apiClient';

// Fetches publicly available rental/equipment products from the
// customer-facing API. Unchanged — out of scope for the material catalogue
// rework below.
const CUSTOMER_API_URL = process.env.EXPO_PUBLIC_CUSTOMER_API_URL;

const fetchJSON = async (url) => {
  const res  = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
};

export const catalogueService = {
  /**
   * Search the admin-managed material catalogue while adding a product —
   * see AddProductScreen's "From Catalogue" tab. This hits the seller
   * backend (sellerb) directly, since it reads the same shared
   * 'catalogueproducts' collection the admin panel writes to.
   * @param {string} search - optional search query
   * @param {string} category - optional category filter
   */
  getMaterialCatalogue: (search = '', category = '') => {
    const params = new URLSearchParams({ limit: '30' });
    if (search)   params.append('search',   search);
    if (category) params.append('category', category);
    return api.get(`/catalogue-products/search?${params.toString()}`)
      .then((d) => d.products || [])
      .catch(() => []);
  },

  /**
   * Fetch rental/equipment products from the public catalogue.
   * @param {string} search - optional search query
   * @param {string} category - optional category filter
   */
  getRentalCatalogue: (search = '', category = '') => {
    const params = new URLSearchParams({ type: 'rental', limit: '50' });
    if (search)   params.append('search',   search);
    if (category) params.append('category', category);
    return fetchJSON(`${CUSTOMER_API_URL}/products/public?${params.toString()}`)
      .then((d) => d.products || [])
      .catch(() => []);
  },
};
