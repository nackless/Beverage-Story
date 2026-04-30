import type { MediaStore, MediaListOptions, MediaUploadOptions } from 'tinacms';

const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryMediaProvider: MediaStore = {
  async persist(files: MediaUploadOptions[]) {
    if (!cloudName || !uploadPreset) {
      console.error('Cloudinary credentials not configured');
      throw new Error('Cloudinary Cloud Name or Upload Preset not configured');
    }

    const uploaded = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'tina-cms'); // Organize uploads in a folder

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json() as any;
        
        uploaded.push({
          directory: file.directory,
          file: {
            name: file.file.name,
            // Use the secure_url from Cloudinary
            url: data.secure_url,
          },
        });
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
      }
    }

    return uploaded;
  },

  async list(options: MediaListOptions) {
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
    if (!cloudName) {
      console.error('Cloudinary Cloud Name not configured');
      throw new Error('Cloudinary Cloud Name not configured');
    }

    // Note: Deleting requires your Cloudinary API key (backend only)
    // For security, deletion should be handled via a backend endpoint
    console.warn('Deletion not implemented for client-side Cloudinary integration');
  },
};
