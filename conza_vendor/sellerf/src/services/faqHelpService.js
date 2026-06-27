// Fetches FAQ and Help content from the admin backend public endpoints.
// No auth token required — public read-only endpoints.

const ADMIN_API_BASE_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_URL || 'http://localhost:5000/api';

/**
 * Fetch FAQ sections for the Vendor app.
 * Returns { sections: [{ title, icon, items: [{q, a}] }], total }
 */
export const fetchVendorFAQs = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/faq-help/public/faqs/vendor`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch FAQs');
  }
  return data;
};

/**
 * Fetch Help articles for the Vendor app.
 * Returns { articles: [{ title, content, order }], total }
 */
export const fetchVendorHelpArticles = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/faq-help/public/help/vendor`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch help articles');
  }
  return data;
};
