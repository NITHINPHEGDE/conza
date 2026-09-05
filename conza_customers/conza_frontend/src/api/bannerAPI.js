// Fetches active Customer-app banners from the admin backend public endpoint.
const ADMIN_API_BASE_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_URL || 'http://localhost:5000/api';

export const fetchCustomerBanners = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/content/public/banners/customer`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch banners');
  return data;
};
