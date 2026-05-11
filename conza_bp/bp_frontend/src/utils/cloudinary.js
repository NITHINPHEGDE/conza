// src/utils/cloudinary.js

const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;


export const uploadImageToCloudinary = async (imageUri) => {
  const formData = new FormData();

  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', { uri: imageUri, name: filename, type });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'conza_partners');

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  console.log('[Cloudinary] Uploading to:', url);
  console.log('[Cloudinary] Using preset:', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(url, { method: 'POST', body: formData });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Cloudinary] Upload failed:', response.status, errorData);
    throw new Error(errorData.error?.message || 'Image upload failed');
  }

  const data = await response.json();
  console.log('[Cloudinary] Upload success:', data.secure_url);
  return data.secure_url;

};