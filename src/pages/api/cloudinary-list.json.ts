import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const cloudName = process.env.PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'disd3nwm7';
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (apiKey && apiSecret) {
    try {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image?max_results=500`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Cloudinary API list error:', e);
    }
  }

  return new Response(JSON.stringify({ resources: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
