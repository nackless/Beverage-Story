var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// tina/cloudinaryMediaProvider.ts
var cloudinaryMediaProvider_exports = {};
__export(cloudinaryMediaProvider_exports, {
  CloudinaryMediaStore: () => CloudinaryMediaStore,
  cloudinaryMediaProvider: () => cloudinaryMediaProvider
});
var getEnvValue, getCloudinaryConfig, getStoredMedia, saveStoredMedia, CloudinaryMediaStore, cloudinaryMediaProvider;
var init_cloudinaryMediaProvider = __esm({
  "tina/cloudinaryMediaProvider.ts"() {
    "use strict";
    getEnvValue = (name) => {
      if (typeof window !== "undefined") {
        const win = window;
        if (win[name]) return win[name];
        if (win[`PUBLIC_${name}`]) return win[`PUBLIC_${name}`];
        if (win[`VITE_${name}`]) return win[`VITE_${name}`];
      }
      const runtimeEnv = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
      const processEnv = typeof process !== "undefined" ? process.env : {};
      return runtimeEnv[name] || runtimeEnv[`PUBLIC_${name}`] || runtimeEnv[`VITE_${name}`] || processEnv[name] || processEnv[`PUBLIC_${name}`] || processEnv[`VITE_${name}`];
    };
    getCloudinaryConfig = () => {
      let preset = getEnvValue("PUBLIC_CLOUDINARY_UPLOAD_PRESET") || getEnvValue("VITE_CLOUDINARY_UPLOAD_PRESET") || getEnvValue("CLOUDINARY_UPLOAD_PRESET") || "bev-story-images";
      if (!preset || preset === "my_blog_preset") {
        preset = "bev-story-images";
      }
      return {
        cloudName: getEnvValue("PUBLIC_CLOUDINARY_CLOUD_NAME") || getEnvValue("VITE_CLOUDINARY_CLOUD_NAME") || getEnvValue("CLOUDINARY_CLOUD_NAME") || "disd3nwm7",
        uploadPreset: preset
      };
    };
    getStoredMedia = () => {
      if (typeof window === "undefined") return [];
      try {
        const raw = localStorage.getItem("tina_cloudinary_media_items");
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    };
    saveStoredMedia = (items) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem("tina_cloudinary_media_items", JSON.stringify(items.slice(0, 100)));
      } catch {
      }
    };
    CloudinaryMediaStore = class {
      constructor() {
        __publicField(this, "accept", "image/*");
      }
      async previewSrc(src) {
        if (!src) return "";
        if (typeof src === "object" && src !== null) {
          return src.previewSrc || src.src || src.url || src.id || "";
        }
        if (typeof src !== "string") return "";
        return src;
      }
      async persist(files) {
        const { cloudName, uploadPreset } = getCloudinaryConfig();
        if (!cloudName || !uploadPreset) {
          const error = `Cloudinary credentials missing. Cloud Name: ${!cloudName ? "\u274C" : "\u2705"}, Preset: ${!uploadPreset ? "\u274C" : "\u2705"}`;
          console.error("\u274C " + error);
          throw new Error(error);
        }
        console.log(`\u{1F4E4} Uploading ${files.length} file(s) to Cloudinary...`);
        const uploaded = [];
        const uploadDirectly = async (file) => {
          const cleanPreset = uploadPreset.trim();
          const cleanCloudName = cloudName.trim();
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", cleanPreset);
          const url = `https://api.cloudinary.com/v1_1/${cleanCloudName}/auto/upload`;
          console.log(`  \u{1F4E4} Uploading directly: ${file.name} to ${url} with preset ${cleanPreset}`);
          const response = await fetch(url, {
            method: "POST",
            body: formData
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error("\u274C Cloudinary Upload Error Details:", {
              cloudName: cleanCloudName,
              uploadPreset: cleanPreset,
              status: response.status,
              response: errorText
            });
            throw new Error(`Direct upload failed (${response.status}) [Cloud: "${cleanCloudName}", Preset: "${cleanPreset}"]: ${errorText}`);
          }
          const data = await response.json();
          if (data.error) {
            console.error("\u274C Cloudinary API returned error:", data.error);
            throw new Error(`Cloudinary API error: ${JSON.stringify(data.error)}. Please verify your Cloud Name ("${cleanCloudName}") and Upload Preset ("${cleanPreset}") are correct.`);
          }
          return data;
        };
        for (const file of files) {
          try {
            const data = await uploadDirectly(file.file);
            if (!data.secure_url) {
              const errorDetails = JSON.stringify(data);
              console.error("\u274C Invalid Cloudinary response - missing secure_url:", errorDetails);
              throw new Error(`Cloudinary upload failed: Response missing secure_url. Details: ${errorDetails}. Check your upload preset configuration and cloud name.`);
            }
            console.log(`  \u2705 Uploaded: ${file.file.name} \u2192 ${data.secure_url}`);
            const itemId = `${file.directory || ""}/${file.file.name}`.replace(/^\//, "");
            const mediaItem = {
              id: itemId,
              type: "file",
              filename: file.file.name || "upload",
              directory: file.directory || "",
              src: data.secure_url,
              previewSrc: data.secure_url
            };
            uploaded.push(mediaItem);
            const stored = getStoredMedia();
            if (!stored.some((i) => i.src === mediaItem.src)) {
              stored.unshift(mediaItem);
              saveStoredMedia(stored);
            }
          } catch (error) {
            console.error("\u274C Cloudinary upload error:", error);
            throw error;
          }
        }
        console.log(`\u2705 Successfully uploaded ${uploaded.length} file(s)`);
        return uploaded;
      }
      async list(options) {
        const localItems = getStoredMedia();
        try {
          const response = await fetch("/.netlify/functions/cloudinary-list");
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.resources) && data.resources.length > 0) {
              const fetchedItems = data.resources.map((res) => ({
                id: res.public_id,
                type: "file",
                filename: `${res.public_id}.${res.format}`,
                directory: "",
                src: res.secure_url,
                previewSrc: res.secure_url
              }));
              const combined = [...localItems];
              for (const item of fetchedItems) {
                if (!combined.some((i) => i.src === item.src)) {
                  combined.push(item);
                }
              }
              saveStoredMedia(combined);
              return {
                items: combined,
                nextOffset: null
              };
            }
          }
        } catch (e) {
          console.warn("\u26A0\uFE0F Unable to fetch server Cloudinary list, using local stored items:", e);
        }
        return {
          items: localItems,
          nextOffset: null
        };
      }
      async delete(media) {
        const target = typeof media === "string" ? media : media?.src || media?.id;
        if (target) {
          const updated = getStoredMedia().filter((i) => i.src !== target && i.id !== target);
          saveStoredMedia(updated);
        }
      }
    };
    cloudinaryMediaProvider = new CloudinaryMediaStore();
  }
});

// tina/config.ts
import { defineConfig } from "tinacms";
var slugify = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.toLowerCase().trim().replace(/ /g, "-").replace(/[-]+/g, "-").replace(/[^\w-]+/g, "");
};
var getEnvValue2 = (name) => {
  const runtimeEnv = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  const processEnv = typeof process !== "undefined" ? process.env : {};
  return runtimeEnv[name] || runtimeEnv[`PUBLIC_${name}`] || runtimeEnv[`VITE_${name}`] || processEnv[name] || processEnv[`PUBLIC_${name}`] || processEnv[`VITE_${name}`];
};
var branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";
var clientId = getEnvValue2("PUBLIC_TINA_CLIENT_ID") || getEnvValue2("TINA_PUBLIC_CLIENT_ID") || getEnvValue2("TINA_CLIENT_ID") || getEnvValue2("NEXT_PUBLIC_TINA_CLIENT_ID") || "1efb06e9-53f1-4452-bb54-a224ec8ecc1a";
var token = getEnvValue2("TINA_TOKEN") || getEnvValue2("TINA_CLOUD_TOKEN") || getEnvValue2("TINA_CLOUD_READONLY_TOKEN");
var config_default = defineConfig({
  branch,
  clientId,
  token,
  media: {
    loadCustomStore: async () => {
      const { CloudinaryMediaStore: CloudinaryMediaStore2 } = await Promise.resolve().then(() => (init_cloudinaryMediaProvider(), cloudinaryMediaProvider_exports));
      return CloudinaryMediaStore2;
    }
  },
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [
      {
        name: "post",
        label: "Posts",
        path: "src/content/posts",
        ui: {
          itemProps: (item) => {
            return { label: item?.title || item?.name || "Post" };
          },
          filename: {
            readonly: true,
            slugify: (values) => {
              return slugify(values?.title) || "new-post";
            }
          },
          beforeSubmit: async ({ values }) => {
            if (!values) return {};
            const titleSlug = slugify(values?.title);
            return {
              ...values,
              slug: titleSlug || slugify(values?.slug) || "new-post"
            };
          }
        },
        defaultItem: () => ({
          title: "New Post",
          author: "analytical bull"
        }),
        fields: [
          // {
          // 	name: "layout",
          // 	label: "Layout",
          // 	type: "string",
          // 	required: true,
          // 	searchable: false,
          // },
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            required: true
          },
          {
            type: "datetime",
            name: "pubDate",
            label: "Publishing Date",
            required: true
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true
          },
          {
            type: "string",
            name: "slug",
            label: "Slug",
            description: "Auto-generated from Title if left empty",
            required: false
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
            options: [
              {
                value: "technical",
                label: "Technical"
              },
              {
                value: "advice",
                label: "Advice"
              },
              {
                value: "learning",
                label: "Learning"
              },
              {
                value: "life lessons",
                label: "Life lessons"
              },
              {
                value: "wisdom",
                label: "Wisdom"
              },
              {
                value: "productivity",
                label: "Productivity"
              },
              {
                value: "meaning",
                label: "Meaning"
              },
              {
                value: "forward planning",
                label: "Forward planning"
              }
            ]
          },
          {
            type: "object",
            name: "image",
            label: "Cover Image",
            fields: [
              {
                type: "image",
                name: "url",
                label: "Image URL",
                ui: {
                  parse: (media) => typeof media === "object" && media !== null ? media.src || media.url || "" : media,
                  format: (value) => typeof value === "object" && value !== null ? value.src || value.url || "" : value
                }
              },
              {
                type: "string",
                name: "alt",
                label: "Alt Text"
              },
              {
                type: "string",
                name: "caption",
                label: "Image Caption"
              },
              {
                type: "number",
                name: "width",
                label: "Width (px)",
                ui: {
                  step: 10
                }
              },
              {
                type: "number",
                name: "height",
                label: "Height (px)",
                ui: {
                  step: 10
                }
              },
              {
                type: "number",
                name: "borderRadius",
                label: "Border Radius (px)",
                description: "0 for square, 12+ for rounded, 999 for circle",
                ui: {
                  step: 5
                }
              },
              {
                type: "string",
                name: "alignment",
                label: "Alignment",
                options: [
                  { label: "Left", value: "left" },
                  { label: "Center", value: "center" },
                  { label: "Right", value: "right" }
                ]
              }
            ]
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
            templates: [
              {
                name: "Image",
                label: "Image",
                ui: {
                  itemProps: (item) => {
                    return { label: item?.alt || item?.caption || "Image" };
                  },
                  defaultItem: {
                    caption: "Image caption"
                  }
                },
                fields: [
                  {
                    name: "src",
                    label: "Image Source",
                    type: "image",
                    required: true,
                    ui: {
                      parse: (media) => typeof media === "object" && media !== null ? media.src || media.url || "" : media,
                      format: (value) => typeof value === "object" && value !== null ? value.src || value.url || "" : value
                    }
                  },
                  {
                    name: "alt",
                    label: "Alt Text",
                    type: "string"
                  },
                  {
                    name: "caption",
                    label: "Caption",
                    type: "string"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  // search: {
  //   tina: {
  //     indexerToken: '28d0e10f1b36319d510fa12d1bed025cdbfb2460',
  //     stopwordLanguages: ['eng'],
  //   },
  //   indexBatchSize: 100,
  //   maxSearchIndexFieldLength: 100,
  // },
});
export {
  config_default as default
};
