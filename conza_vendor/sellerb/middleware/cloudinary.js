// conzasb/middleware/cloudinary.js
const crypto = require('crypto');
const fetch  = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

/**
 * Generate a signed upload signature for direct browser/device → Cloudinary uploads.
 * The frontend calls GET /api/products/upload-signature, gets this token,
 * then posts the image directly to Cloudinary — the API secret never leaves the server.
 */
const generateUploadSignature = (folder = 'conza/products') => {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error('Cloudinary env vars not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Signature covers every param sent to Cloudinary (alphabetical order)
  const toSign    = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha256')
    .update(toSign + apiSecret)
    .digest('hex');

  return { signature, timestamp, apiKey, cloudName, folder };
};

/**
 * Delete an image from Cloudinary by public_id.
 * Called server-side when a product is deleted.
 */
const deleteFromCloudinary = async (publicId) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHash('sha256')
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
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

/**
 * Extract Cloudinary public_id from a secure_url.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v1/conza/products/abc123.jpg"
 *   → "conza/products/abc123"
 */
const extractPublicId = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  return match ? match[1] : null;
};

module.exports = { generateUploadSignature, deleteFromCloudinary, extractPublicId };