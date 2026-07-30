import type { MediaStore, MediaListOptions, MediaUploadOptions } from 'tinacms';

const getEnvValue = (name: string) => {
  const runtimeEnv = typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    : {};

  return runtimeEnv[name] || (typeof process !== 'undefined' ? process.env?.[name] : undefined);
};

const getCloudinaryConfig = () => ({
  cloudName: getEnvValue('VITE_CLOUDINARY_CLOUD_NAME') || getEnvValue('CLOUDINARY_CLOUD_NAME'),
  uploadPreset: getEnvValue('VITE_CLOUDINARY_UPLOAD_PRESET') || getEnvValue('CLOUDINARY_UPLOAD_PRESET'),
});

const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export const cloudinaryMediaProvider: MediaStore = {
  async persist(files: MediaUploadOptions[]) {
    const { cloudName, uploadPreset } = getCloudinaryConfig();

    if (!cloudName || !uploadPreset) {
      const error = `Cloudinary credentials missing. Cloud Name: ${!cloudName ? '❌' : '✅'}, Preset: ${!uploadPreset ? '❌' : '✅'}`;
      console.error('❌ ' + error);
      throw new Error(error);
    }

    console.log(`📤 Uploading ${files.length} file(s) to Cloudinary...`);
    const uploaded = [];

    for (const file of files) {
      const endpoint = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? `${window.location.origin}/.netlify/functions/cloudinary-upload`
        : undefined;

      try {
        let data: any;

        if (endpoint) {
          const fileData = await readFileAsBase64(file.file);
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.file.name,
              fileType: file.file.type,
              fileData,
              uploadPreset,
              cloudName,
              folder: 'tina-cms',
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed (${response.status}): ${errorText}`);
          }

          data = await response.json();
        } else {
          const formData = new FormData();
          formData.append('file', file.file);
          formData.append('upload_preset', uploadPreset!);
          formData.append('folder', 'tina-cms');

          const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
          console.log(`  📤 Uploading: ${file.file.name} to ${url}`);

          const response = await fetch(url, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed (${response.status}): ${errorText}`);
          }

          data = await response.json();
        }

        console.log(`  ✅ Uploaded: ${file.file.name} → ${data.secure_url}`);

        uploaded.push({
          directory: file.directory,
          file: {
            name: file.file.name,
            url: data.secure_url,
          },
        });
      } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        throw error;
      }
    }

    console.log(`✅ Successfully uploaded ${uploaded.length} file(s)`);
    return uploaded;
  },

  async list(options: MediaListOptions) {
    const { cloudName } = getCloudinaryConfig();

    if (!cloudName) {
      console.error('Cloudinary Cloud Name not configured');
      throw new Error('Cloudinary Cloud Name not configured');
    }

    try {
      // Note: This requires a server-side API call with your Cloudinary API key
      // For now, we'll return an empty list as this requires backend authentication
      // You can implement this with a backend API endpoint if needed
      return {
        items: [],
        directories: [],
        hasNextPage: false,
      };
    } catch (error) {
      console.error('Cloudinary list error:', error);
      return {
        items: [],
        directories: [],
        hasNextPage: false,
      };
    }
  },

  async delete(asset: string) {
    const { cloudName } = getCloudinaryConfig();

    if (!cloudName) {
      console.error('Cloudinary Cloud Name not configured');
      throw new Error('Cloudinary Cloud Name not configured');
    }

    // Note: Deleting requires your Cloudinary API key (backend only)
    // For security, deletion should be handled via a backend endpoint
    console.warn('Deletion not implemented for client-side Cloudinary integration');
  },
};
