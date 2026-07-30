import crypto from 'node:crypto';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { fileData, fileName, fileType, folder = 'tina-cms', uploadPreset, cloudName } = body;

    const cloudNameValue = cloudName || process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPresetValue = uploadPreset || process.env.CLOUDINARY_UPLOAD_PRESET || process.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudNameValue || !uploadPresetValue || !apiKey || !apiSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Cloudinary server credentials missing' }),
      };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${encodeURIComponent(folder)}&timestamp=${timestamp}&upload_preset=${uploadPresetValue}`;
    const signature = crypto
      .createHash('sha1')
      .update(`${paramsToSign}${apiSecret}`)
      .digest('hex');

    const formData = new FormData();
    formData.append('file', Buffer.from(fileData, 'base64'), fileName || 'upload');
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('upload_preset', uploadPresetValue);
    formData.append('folder', folder);

    if (fileType) {
      formData.append('resource_type', fileType.startsWith('image/') ? 'image' : 'auto');
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudNameValue}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

export default handler;
