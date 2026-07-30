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

export class CloudinaryMediaStore implements MediaStore {
  accept = 'image/*';
  private sessionItems: Media[] = [];

  async previewSrc(src: any) {
    if (!src) return '';
    if (typeof src === 'object' && src !== null) {
      return src.src || src.url || src.id || '';
    }
    if (typeof src !== 'string') return '';
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

        const itemId = `${file.directory || ''}/${file.file.name}`.replace(/^\//, '');
        const mediaItem: Media = {
          id: itemId,
          type: 'file',
          filename: file.file.name || 'upload',
          directory: file.directory || '',
          src: data.secure_url,
        };
        uploaded.push(mediaItem);

        // Add to session list if not already present
        if (!this.sessionItems.some((i) => i.src === mediaItem.src)) {
          this.sessionItems.unshift(mediaItem);
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
    return {
      items: this.sessionItems,
      nextOffset: null,
    };
  }

  async delete(media: any) {
    const target = typeof media === 'string' ? media : (media?.src || media?.id);
    if (target) {
      this.sessionItems = this.sessionItems.filter((i) => i.src !== target && i.id !== target);
    }
  }
}

export const cloudinaryMediaProvider = new CloudinaryMediaStore();
