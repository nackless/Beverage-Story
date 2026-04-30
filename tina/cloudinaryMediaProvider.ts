import * as dotenv from 'dotenv';
import * as path from 'path';
import type { MediaStore, MediaListOptions, MediaUploadOptions } from 'tinacms';

// Load .env.local explicitly
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;

console.log('🔍 Cloudinary Provider Debug:');
console.log('  Cloud Name:', cloudName ? '✅ Detected' : '❌ Not found');
console.log('  Upload Preset:', uploadPreset ? '✅ Detected' : '❌ Not found');

export const cloudinaryMediaProvider: MediaStore = {
  async persist(files: MediaUploadOptions[]) {
    if (!cloudName || !uploadPreset) {
      const error = `Cloudinary credentials missing. Cloud Name: ${!cloudName ? '❌' : '✅'}, Preset: ${!uploadPreset ? '❌' : '✅'}`;
      console.error('❌ ' + error);
      throw new Error(error);
    }

    console.log(`📤 Uploading ${files.length} file(s) to Cloudinary...`);
    const uploaded = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('upload_preset', uploadPreset!);
      formData.append('folder', 'tina-cms'); // Organize uploads in a folder

      try {
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

        const data = await response.json() as any;
        
        console.log(`  ✅ Uploaded: ${file.file.name} → ${data.secure_url}`);
        
        uploaded.push({
          directory: file.directory,
          file: {
            name: file.file.name,
            // Use the secure_url from Cloudinary
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
