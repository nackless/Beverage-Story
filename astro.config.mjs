import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
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
