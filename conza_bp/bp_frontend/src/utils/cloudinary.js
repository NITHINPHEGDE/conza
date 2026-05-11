// src/utils/cloudinary.js
import { api } from '../services/apiClient';

export const uploadImageToCloudinary = async (imageUri) => {
  // Step 1 — get signature from our backend
  const { signature, timestamp, folder, cloud_name, api_key } =
    await api.get('/workers/upload-signature');

  // Step 2 — build multipart form
  const filename = imageUri.split('/').pop();
  const match    = /\.(\w+)$/.exec(filename);
  const type     = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('file',      { uri: imageUri, name: filename, type });
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('api_key',   api_key);
  formData.append('folder',    folder);

  // Step 3 — upload directly to Cloudinary (signed, no preset needed)
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Image upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};