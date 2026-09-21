// conzavf/src/services/catalogueService.js
// Fetches publicly available products from the customer-facing API
// so vendors can pick from the existing catalogue instead of typing from scratch.

const CUSTOMER_API_URL = process.env.EXPO_PUBLIC_CUSTOMER_API_URL;

const fetchJSON = async (url) => {
  const res  = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
};

export const catalogueService = {
  /**
   * Fetch material products from the public catalogue.
   * @param {string} search - optional search query
   * @param {string} category - optional category filter
   */
  getMaterialCatalogue: (search = '', category = '') => {
    const params = new URLSearchParams({ type: 'material', limit: '50' });
    if (search)   params.append('search',   search);
    if (category) params.append('category', category);
    return fetchJSON(`${CUSTOMER_API_URL}/products/public?${params.toString()}`)
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
