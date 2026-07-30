import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: {
    define: {
      'process.env.CLOUDINARY_CLOUD_NAME': JSON.stringify(
        process.env.PUBLIC_CLOUDINARY_CLOUD_NAME ||
        process.env.VITE_CLOUDINARY_CLOUD_NAME ||
        process.env.CLOUDINARY_CLOUD_NAME ||
        ''
      ),
      'process.env.CLOUDINARY_UPLOAD_PRESET': JSON.stringify(
        process.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
        process.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
        process.env.CLOUDINARY_UPLOAD_PRESET ||
        ''
      ),
    },
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
    // Allow remote images from Cloudinary and localhost
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
});
