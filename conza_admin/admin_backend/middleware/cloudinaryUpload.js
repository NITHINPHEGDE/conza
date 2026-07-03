// conza_admin/admin_backend/middleware/cloudinaryUpload.js
const crypto = require('crypto');

/**
 * Upload a base64 data-URI to Cloudinary using a signed upload (API key + secret).
 * Returns the secure_url string. Uses Node's native fetch (Node 18+), no extra deps.
 */
const uploadToCloudinary = async (fileDataUri, folder = 'conza/services') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signaturePayload = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha256')
    .update(signaturePayload + apiSecret)
    .digest('hex');

  const params = new URLSearchParams();
  params.append('file',      fileDataUri);
  params.append('api_key',   apiKey);
  params.append('timestamp', timestamp);
  params.append('folder',    folder);
  params.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: params }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }

  return data.secure_url;
};

/**
 * Delete an image from Cloudinary by its public_id.
 */
const deleteFromCloudinary = async (publicId) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha256')
    .update(signaturePayload + apiSecret)
    .digest('hex');

  const params = new URLSearchParams();
  params.append('public_id', publicId);
  params.append('api_key',   apiKey);
  params.append('timestamp', timestamp);
  params.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: 'POST', body: params }
  );

  const data = await response.json();
  return data.result;
};

// Extract Cloudinary public_id from a secure_url so we can delete old images on replace
const extractPublicId = (url, folder = 'conza/services') => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

module.exports = { uploadToCloudinary, deleteFromCloudinary, extractPublicId };