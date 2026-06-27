// Fetches FAQ and Help content from the admin backend public endpoints.
// No auth token required — public read-only endpoints.

const ADMIN_API_BASE_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_URL || 'https://conza-production-8ba6.up.railway.app/api';

/**
 * Fetch FAQ sections for the Worker app.
 * Returns { sections: [{ title, icon, items: [{q, a}] }], total }
 */
export const fetchWorkerFAQs = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/faq-help/public/faqs/worker`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch FAQs');
  }
  return data;
};

/**
 * Fetch Help articles for the Worker app.
 * Returns { articles: [{ _id, title, content, order, createdAt }], total }
 */
export const fetchWorkerHelpArticles = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/faq-help/public/help/worker`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch help articles');
  }
  return data;
};
