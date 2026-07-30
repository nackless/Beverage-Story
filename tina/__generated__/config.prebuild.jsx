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
var getEnvValue, getCloudinaryConfig, readFileAsBase64, CloudinaryMediaStore, cloudinaryMediaProvider;
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
    getCloudinaryConfig = () => ({
      cloudName: getEnvValue("PUBLIC_CLOUDINARY_CLOUD_NAME") || getEnvValue("VITE_CLOUDINARY_CLOUD_NAME") || getEnvValue("CLOUDINARY_CLOUD_NAME"),
      uploadPreset: getEnvValue("PUBLIC_CLOUDINARY_UPLOAD_PRESET") || getEnvValue("VITE_CLOUDINARY_UPLOAD_PRESET") || getEnvValue("CLOUDINARY_UPLOAD_PRESET")
    });
    readFileAsBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
    CloudinaryMediaStore = class {
      constructor() {
        __publicField(this, "accept", "image/*");
      }
      async previewSrc(src) {
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
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);
          formData.append("folder", "tina-cms");
          const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
          console.log(`  \u{1F4E4} Uploading directly: ${file.name} to ${url}`);
          const response = await fetch(url, {
            method: "POST",
            body: formData
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Direct upload failed (${response.status}): ${errorText}`);
          }
          return await response.json();
        };
        for (const file of files) {
          const endpoint = typeof window !== "undefined" && window.location.hostname !== "localhost" ? `${window.location.origin}/.netlify/functions/cloudinary-upload` : void 0;
          try {
            let data;
            if (endpoint) {
              try {
                const fileData = await readFileAsBase64(file.file);
                const response = await fetch(endpoint, {
                  method: "POST",
                  headers: {
                    "content-type": "application/json"
                  },
                  body: JSON.stringify({
                    fileName: file.file.name,
                    fileType: file.file.type,
                    fileData,
                    uploadPreset,
                    cloudName,
                    folder: "tina-cms"
                  })
                });
                if (response.ok) {
                  data = await response.json();
                } else {
                  console.warn(`Netlify function returned status ${response.status}. Falling back to direct Cloudinary upload...`);
                  data = await uploadDirectly(file.file);
                }
              } catch (funcErr) {
                console.warn("Netlify function upload error, falling back to direct upload:", funcErr);
                data = await uploadDirectly(file.file);
              }
            } else {
              data = await uploadDirectly(file.file);
            }
            console.log(`  \u2705 Uploaded: ${file.file.name} \u2192 ${data.secure_url}`);
            uploaded.push({
              directory: file.directory,
              file: {
                name: file.file.name,
                url: data.secure_url
              }
            });
          } catch (error) {
            console.error("\u274C Cloudinary upload error:", error);
            throw error;
          }
        }
        console.log(`\u2705 Successfully uploaded ${uploaded.length} file(s)`);
        return uploaded;
      }
      async list(options) {
        const { cloudName } = getCloudinaryConfig();
        if (!cloudName) {
          console.error("Cloudinary Cloud Name not configured");
          throw new Error("Cloudinary Cloud Name not configured");
        }
        try {
          return {
            items: [],
            directories: [],
            hasNextPage: false
          };
        } catch (error) {
          console.error("Cloudinary list error:", error);
          return {
            items: [],
            directories: [],
            hasNextPage: false
          };
        }
      }
      async delete(asset) {
        const { cloudName } = getCloudinaryConfig();
        if (!cloudName) {
          console.error("Cloudinary Cloud Name not configured");
          throw new Error("Cloudinary Cloud Name not configured");
        }
        console.warn("Deletion not implemented for client-side Cloudinary integration");
      }
    };
    cloudinaryMediaProvider = new CloudinaryMediaStore();
  }
});

// tina/config.ts
init_cloudinaryMediaProvider();
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
          filename: {
            readonly: true,
            slugify: (values) => {
              return slugify(values?.title) || "new-post";
            }
          },
          beforeSubmit: async ({ values }) => {
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
                label: "Image URL"
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
                  defaultItem: {
                    caption: "Image caption"
                  }
                },
                fields: [
                  {
                    name: "src",
                    label: "Image Source",
                    type: "image",
                    required: true
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
