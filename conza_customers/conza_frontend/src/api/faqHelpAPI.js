// Fetches FAQ and Help content from the admin backend public endpoints.
// No auth token required — these are public read-only endpoints.

const ADMIN_API_BASE_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_URL || 'http://localhost:5000/api'

/**
 * Fetch FAQ sections for the Customer app.
 * Returns { sections: [{ title, icon, items: [{q, a}] }], total }
 */
export const fetchCustomerFAQs = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/faq-help/public/faqs/customer`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  )
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch FAQs')
  }
  return data
}

/**
 * Fetch Help articles for the Customer app.
 * Returns { articles: [{ title, content, order }], total }
 */
export const fetchCustomerHelpArticles = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/faq-help/public/help/customer`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  )
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch help articles')
  }
  return data
}
