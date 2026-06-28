// Fetches Legal (Terms/Privacy) and About Us content from the admin backend public endpoints.
const ADMIN_API_BASE_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_URL || 'https://conza-production-8ba6.up.railway.app/api';

export const fetchWorkerLegal = async () => {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/content/public/legal/worker`,
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
