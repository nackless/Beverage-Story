export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  const cloudName = (
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.VITE_CLOUDINARY_CLOUD_NAME ||
    'disd3nwm7'
  ).trim();

  const apiKey = (
    process.env.CLOUDINARY_API_KEY ||
    process.env.PUBLIC_CLOUDINARY_API_KEY ||
    process.env.VITE_CLOUDINARY_API_KEY ||
    ''
  ).trim();

  const apiSecret = (
    process.env.CLOUDINARY_API_SECRET ||
    process.env.PUBLIC_CLOUDINARY_API_SECRET ||
    process.env.VITE_CLOUDINARY_API_SECRET ||
    ''
  ).trim();

  if (!apiKey || !apiSecret) {
    console.warn('CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET missing in server env');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ resources: [], warning: 'Missing CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET in environment' }),
    };
  }

  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?max_results=500`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudinary API list error:', response.status, data);
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ resources: [], error: data?.error?.message || JSON.stringify(data) }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Failed to list Cloudinary resources:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ resources: [], error: error.message }),
    };
  }
}

export default handler;
