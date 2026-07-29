// tina/config.ts
import { defineConfig } from "tinacms";

// tina/cloudinaryMediaProvider.ts
var cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
var uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;
var cloudinaryMediaProvider = {
  async persist(files) {
    if (!cloudName || !uploadPreset) {
      const error = `Cloudinary credentials missing. Cloud Name: ${!cloudName ? "\u274C" : "\u2705"}, Preset: ${!uploadPreset ? "\u274C" : "\u2705"}`;
      console.error("\u274C " + error);
      throw new Error(error);
    }
    console.log(`\u{1F4E4} Uploading ${files.length} file(s) to Cloudinary...`);
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "tina-cms");
      try {
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
        console.log(`  \u{1F4E4} Uploading: ${file.file.name} to ${url}`);
        const response = await fetch(url, {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        console.log(`  \u2705 Uploaded: ${file.file.name} \u2192 ${data.secure_url}`);
        uploaded.push({
          directory: file.directory,
          file: {
            name: file.file.name,
            // Use the secure_url from Cloudinary
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
  },
  async list(options) {
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
  },
  async delete(asset) {
    if (!cloudName) {
      console.error("Cloudinary Cloud Name not configured");
      throw new Error("Cloudinary Cloud Name not configured");
    }
    console.warn("Deletion not implemented for client-side Cloudinary integration");
  }
};

// tina/config.ts
var slugify = (str) => {
  const s = str.toLowerCase().trim().replace(/ /g, "-").replace(/[-]+/g, "-").replace(/[^\w-]+/g, "");
  return s;
};
var branch = (
  // process.env.GITHUB_BRANCH ||
  // process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD || "main"
);
var cloudName2 = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
var uploadPreset2 = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;
var useCloudinary = !!(cloudName2 && uploadPreset2);
var config_default = defineConfig({
  branch,
  clientId: "1efb06e9-53f1-4452-bb54-a224ec8ecc1a",
  // Get this from tina.io
  token: process.env.TINA_TOKEN,
  // Get this from tina.io
  media: useCloudinary ? {
    provider: cloudinaryMediaProvider
  } : {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public"
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
              return slugify(values.title);
            }
          }
        },
        defaultItem: () => ({
          title: "New Post",
          author: "analytical bull"
          // layout: "../../layouts/PostLayout.astro",
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
            required: true
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
