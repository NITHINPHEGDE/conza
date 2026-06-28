// Fetches Legal (Terms/Privacy) and About Us content from the admin backend public endpoints.
const ADMIN_API_BASE_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_URL || 'http://localhost:5000/api';

export const fetchCustomerLegal = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/content/public/legal/customer`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch legal content');
  return data;
};

export const fetchAboutUs = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/content/public/about`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch About Us content');
  return data;
};
