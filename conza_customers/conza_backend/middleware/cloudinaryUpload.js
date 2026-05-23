// conzacsb/middleware/cloudinaryUpload.js
const crypto = require('crypto');
const fetch  = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

/**
 * Upload a base64 data-URI to Cloudinary using signed upload (API key + secret).
 * Returns the secure_url string.
 */
const uploadToCloudinary = async (fileDataUri, folder = 'conza/products') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Build the signature: sign "folder=...&timestamp=..." with your API secret
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
 * Useful when a seller deletes a product.
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
  return data.result; // 'ok' on success
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };