// conzavf/src/utils/cloudinary.js

import { Platform } from 'react-native';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Get a signed upload signature from your backend.
 * Backend signs with API secret — frontend never sees the secret.
 */
const getUploadSignature = async () => {
  const { api } = require('../services/apiClient');
  const data = await api.get('/products/upload-signature');
  // returns { signature, timestamp, apiKey, cloudName, folder }
  return data;
};

/**
 * Upload a single image URI to Cloudinary directly from the device.
 * Returns the secure_url string.
 */
export const uploadImageToCloudinary = async (localUri) => {
  const { signature, timestamp, apiKey, cloudName, folder } = await getUploadSignature();

  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    // On web, fetch the local blob/data URI and convert it to a Blob object
    const response = await fetch(localUri);
    const blob = await response.blob();
    formData.append('file', blob, `product_${Date.now()}.jpg`);
  } else {
    // On native mobile, use the standard RN object
    formData.append('file', {
      uri:  localUri,
      type: 'image/jpeg',
      name: `product_${Date.now()}.jpg`,
    });
  }

  formData.append('api_key',   apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder',    folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }

  return data.secure_url;
};

/**
 * Upload multiple images, returns array of secure_urls.
 */
export const uploadImagesToCloudinary = async (localUris, onProgress) => {
  const urls = [];
  for (let i = 0; i < localUris.length; i++) {
    const url = await uploadImageToCloudinary(localUris[i]);
    urls.push(url);
    if (onProgress) onProgress(i + 1, localUris.length);
  }
  return urls;
};