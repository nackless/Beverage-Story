import type { MediaStore, MediaListOptions, MediaUploadOptions } from 'tinacms';

const getEnvValue = (name: string) => {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win[name]) return win[name];
    if (win[`PUBLIC_${name}`]) return win[`PUBLIC_${name}`];
    if (win[`VITE_${name}`]) return win[`VITE_${name}`];
  }

  const runtimeEnv = typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    : {};

  const processEnv = typeof process !== 'undefined' ? process.env : {};

  return (
    runtimeEnv[name] ||
    runtimeEnv[`PUBLIC_${name}`] ||
    runtimeEnv[`VITE_${name}`] ||
    processEnv[name] ||
    processEnv[`PUBLIC_${name}`] ||
    processEnv[`VITE_${name}`]
  );
};

const getCloudinaryConfig = () => ({
  cloudName:
    getEnvValue('PUBLIC_CLOUDINARY_CLOUD_NAME') ||
    getEnvValue('VITE_CLOUDINARY_CLOUD_NAME') ||
    getEnvValue('CLOUDINARY_CLOUD_NAME'),
  uploadPreset:
    getEnvValue('PUBLIC_CLOUDINARY_UPLOAD_PRESET') ||
    getEnvValue('VITE_CLOUDINARY_UPLOAD_PRESET') ||
    getEnvValue('CLOUDINARY_UPLOAD_PRESET'),
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

export class CloudinaryMediaStore implements MediaStore {
  accept = 'image/*';

  async previewSrc(src: string) {
    return src;
  }

  async persist(files: MediaUploadOptions[]) {
    const { cloudName, uploadPreset } = getCloudinaryConfig();

    if (!cloudName || !uploadPreset) {
      const error = `Cloudinary credentials missing. Cloud Name: ${!cloudName ? '❌' : '✅'}, Preset: ${!uploadPreset ? '❌' : '✅'}`;
      console.error('❌ ' + error);
      throw new Error(error);
    }

    console.log(`📤 Uploading ${files.length} file(s) to Cloudinary...`);
    const uploaded = [];

    const uploadDirectly = async (file: File) => {
      const cleanPreset = uploadPreset!.trim();
      const cleanCloudName = cloudName!.trim();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cleanPreset);

      const url = `https://api.cloudinary.com/v1_1/${cleanCloudName}/auto/upload`;
      console.log(`  📤 Uploading directly: ${file.name} to ${url} with preset ${cleanPreset}`);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Direct upload failed (${response.status}): ${errorText}`);
      }

      return await response.json();
    };

    for (const file of files) {
      const endpoint = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? `${window.location.origin}/.netlify/functions/cloudinary-upload`
        : undefined;

      try {
        let data: any;

        if (endpoint) {
          try {
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

            if (response.ok) {
              data = await response.json();
            } else {
              console.warn(`Netlify function returned status ${response.status}. Falling back to direct Cloudinary upload...`);
              data = await uploadDirectly(file.file);
            }
          } catch (funcErr) {
            console.warn('Netlify function upload error, falling back to direct upload:', funcErr);
            data = await uploadDirectly(file.file);
          }
        } else {
          data = await uploadDirectly(file.file);
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
  }

  async list(options?: MediaListOptions) {
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
  }

  async delete(asset: string) {
    const { cloudName } = getCloudinaryConfig();

    if (!cloudName) {
      console.error('Cloudinary Cloud Name not configured');
      throw new Error('Cloudinary Cloud Name not configured');
    }

    // Note: Deleting requires your Cloudinary API key (backend only)
    // For security, deletion should be handled via a backend endpoint
    console.warn('Deletion not implemented for client-side Cloudinary integration');
  }
}

export const cloudinaryMediaProvider = new CloudinaryMediaStore();
