import type { Media, MediaStore, MediaListOptions, MediaUploadOptions } from 'tinacms';

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

const getCloudinaryConfig = () => {
  let preset =
    getEnvValue('PUBLIC_CLOUDINARY_UPLOAD_PRESET') ||
    getEnvValue('VITE_CLOUDINARY_UPLOAD_PRESET') ||
    getEnvValue('CLOUDINARY_UPLOAD_PRESET') ||
    'bev-story-images';

  if (!preset || preset === 'my_blog_preset') {
    preset = 'bev-story-images';
  }

  return {
    cloudName:
      getEnvValue('PUBLIC_CLOUDINARY_CLOUD_NAME') ||
      getEnvValue('VITE_CLOUDINARY_CLOUD_NAME') ||
      getEnvValue('CLOUDINARY_CLOUD_NAME') ||
      'disd3nwm7',
    uploadPreset: preset,
  };
};

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

const STORAGE_KEY = 'tina_cloudinary_media_v2';

const getStoredMedia = (): Media[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];

    return items
      .filter((item: any) => item && typeof item.src === 'string' && (item.src.startsWith('http://') || item.src.startsWith('https://') || item.src.startsWith('data:')))
      .map((item: any) => ({
        id: item.src,
        type: 'file' as const,
        filename: item.filename || item.src.split('/').pop() || 'image.jpg',
        directory: '',
        src: item.src,
        previewSrc: item.src,
      }));
  } catch {
    return [];
  }
};

const saveStoredMedia = (items: Media[]) => {
  if (typeof window === 'undefined') return;
  try {
    const validItems = items.filter((i) => i && typeof i.src === 'string' && (i.src.startsWith('http://') || i.src.startsWith('https://') || i.src.startsWith('data:')));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems.slice(0, 100)));
  } catch {
    // Ignore storage errors
  }
};

export class CloudinaryMediaStore implements MediaStore {
  accept = 'image/*';

  async previewSrc(src: any) {
    if (!src) return '';

    let urlString = '';
    if (typeof src === 'object' && src !== null) {
      urlString = src.previewSrc || src.src || src.url || src.id || '';
    } else if (typeof src === 'string') {
      urlString = src;
    }

    if (typeof urlString === 'string' && (urlString.startsWith('http://') || urlString.startsWith('https://') || urlString.startsWith('data:'))) {
      return urlString;
    }

    const stored = getStoredMedia();
    const match = stored.find((i) => i.id === urlString || i.filename === urlString || (i.src && i.src.includes(urlString)));
    if (match && match.src) {
      return match.previewSrc || match.src;
    }

    return urlString;
  }

  async persist(files: MediaUploadOptions[]) {
    const { cloudName, uploadPreset } = getCloudinaryConfig();

    if (!cloudName || !uploadPreset) {
      const error = `Cloudinary credentials missing. Cloud Name: ${!cloudName ? '❌' : '✅'}, Preset: ${!uploadPreset ? '❌' : '✅'}`;
      console.error('❌ ' + error);
      throw new Error(error);
    }

    console.log(`📤 Uploading ${files.length} file(s) to Cloudinary...`);
    const uploaded: Media[] = [];

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
        console.error('❌ Cloudinary Upload Error Details:', {
          cloudName: cleanCloudName,
          uploadPreset: cleanPreset,
          status: response.status,
          response: errorText,
        });
        throw new Error(`Direct upload failed (${response.status}) [Cloud: "${cleanCloudName}", Preset: "${cleanPreset}"]: ${errorText}`);
      }

      const data = await response.json();
      
      // Check for Cloudinary API errors in the response
      if (data.error) {
        console.error('❌ Cloudinary API returned error:', data.error);
        throw new Error(`Cloudinary API error: ${JSON.stringify(data.error)}. Please verify your Cloud Name ("${cleanCloudName}") and Upload Preset ("${cleanPreset}") are correct.`);
      }
      
      return data;
    };

    for (const file of files) {
      try {
        const data = await uploadDirectly(file.file);
        
        // Validate response has required fields
        if (!data.secure_url) {
          const errorDetails = JSON.stringify(data);
          console.error('❌ Invalid Cloudinary response - missing secure_url:', errorDetails);
          throw new Error(`Cloudinary upload failed: Response missing secure_url. Details: ${errorDetails}. Check your upload preset configuration and cloud name.`);
        }
        
        console.log(`  ✅ Uploaded: ${file.file.name} → ${data.secure_url}`);

        const mediaItem: Media = {
          id: data.secure_url,
          type: 'file',
          filename: file.file.name || 'upload',
          directory: '',
          src: data.secure_url,
          previewSrc: data.secure_url,
        };
        uploaded.push(mediaItem);

        // Store in localStorage
        const stored = getStoredMedia();
        if (!stored.some((i) => i.src === mediaItem.src)) {
          stored.unshift(mediaItem);
          saveStoredMedia(stored);
        }
      } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        throw error;
      }
    }

    console.log(`✅ Successfully uploaded ${uploaded.length} file(s)`);
    return uploaded;
  }

  async list(options?: MediaListOptions) {
    let localItems = getStoredMedia();

    // Try API routes first, then Netlify function
    const endpoints = ['/api/cloudinary-list.json', '/.netlify/functions/cloudinary-list'];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.resources) && data.resources.length > 0) {
            const fetchedItems: Media[] = data.resources.map((res: any) => ({
              id: res.secure_url,
              type: 'file' as const,
              filename: `${res.public_id}.${res.format}`,
              directory: '',
              src: res.secure_url,
              previewSrc: res.secure_url,
            }));

            const combined = [...localItems];
            for (const item of fetchedItems) {
              if (!combined.some((i) => i.src === item.src)) {
                combined.push(item);
              }
            }
            saveStoredMedia(combined);
            localItems = combined;
            break;
          }
        }
      } catch {
        // Ignore network error per endpoint
      }
    }

    return {
      items: localItems,
      nextOffset: null,
    };
  }

  async delete(media: any) {
    const target = typeof media === 'string' ? media : (media?.src || media?.id);
    if (target) {
      const updated = getStoredMedia().filter((i) => i.src !== target && i.id !== target);
      saveStoredMedia(updated);
    }
  }
}

export const cloudinaryMediaProvider = new CloudinaryMediaStore();
