import { defineConfig } from "tinacms";
import { cloudinaryMediaProvider } from "./cloudinaryMediaProvider";

const slugify = (str?: string) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/ /g, '-')
    .replace(/[-]+/g, '-')
    .replace(/[^\w-]+/g, '');
};

const getEnvValue = (name: string) => {
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

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const clientId =
  getEnvValue('PUBLIC_TINA_CLIENT_ID') ||
  getEnvValue('TINA_PUBLIC_CLIENT_ID') ||
  getEnvValue('TINA_CLIENT_ID') ||
  getEnvValue('NEXT_PUBLIC_TINA_CLIENT_ID') ||
  "1efb06e9-53f1-4452-bb54-a224ec8ecc1a";

const token =
  getEnvValue('TINA_TOKEN') ||
  getEnvValue('TINA_CLOUD_TOKEN') ||
  getEnvValue('TINA_CLOUD_READONLY_TOKEN');

// Cloudinary setup
const cloudName =
  getEnvValue('PUBLIC_CLOUDINARY_CLOUD_NAME') ||
  getEnvValue('VITE_CLOUDINARY_CLOUD_NAME') ||
  getEnvValue('CLOUDINARY_CLOUD_NAME');
const uploadPreset =
  getEnvValue('PUBLIC_CLOUDINARY_UPLOAD_PRESET') ||
  getEnvValue('VITE_CLOUDINARY_UPLOAD_PRESET') ||
  getEnvValue('CLOUDINARY_UPLOAD_PRESET');
const useCloudinary = !!(cloudName && uploadPreset);

export default defineConfig({
  branch,
  clientId,
  token,

  media: useCloudinary
    ? {
        loadCustomStore: async () => {
          const { cloudinaryMediaProvider } = await import("./cloudinaryMediaProvider");
          return cloudinaryMediaProvider;
        },
      }
    : {
        tina: {
          mediaRoot: "uploads",
          publicFolder: "public",
        },
      },

  build: {
    outputFolder: "admin",
    publicFolder: "public",
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
              return slugify(values?.title) || 'new-post';
            },
          },
          beforeSubmit: async ({ values }) => {
            return {
              ...values,
              slug: values?.slug ? slugify(values.slug) : slugify(values?.title) || 'new-post',
            };
          },
        },
        defaultItem: () => ({
          title: "New Post",
          slug: "new-post",
          author: "analytical bull",
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
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            required: true,
          },
          {
            type: "datetime",
            name: "pubDate",
            label:"Publishing Date",
            required: true,
            

          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true,
          },
          {
						type: "string",
						name: "slug",
            label: "Slug",
            description: "Auto-generated from Title if left empty",
						required: false,
					},
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
						options: [
							{
								value: "technical",
								label: "Technical",
							},
							{
								value: "advice",
								label: "Advice",
							},							
							{
								value: "learning",
								label: "Learning",
							},
							{
								value: "life lessons",
								label: "Life lessons",
							},
							{
								value: "wisdom",
								label: "Wisdom",
							},
							{
								value: "productivity",
								label: "Productivity",
							},
							{
								value: "meaning",
								label: "Meaning",
							},
              {
								value: "forward planning",
								label: "Forward planning",
							},
            ],
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
              },
              {
                type: "string",
                name: "alt",
                label: "Alt Text",
              },
              {
                type: "string",
                name: "caption",
                label: "Image Caption",
              },
              {
                type: "number",
                name: "width",
                label: "Width (px)",
                ui: {
                  step: 10,
                },
              },
              {
                type: "number",
                name: "height",
                label: "Height (px)",
                ui: {
                  step: 10,
                },
              },
              {
                type: "number",
                name: "borderRadius",
                label: "Border Radius (px)",
                description: "0 for square, 12+ for rounded, 999 for circle",
                ui: {
                  step: 5,
                },
              },
              {
                type: "string",
                name: "alignment",
                label: "Alignment",
                options: [
                  { label: "Left", value: "left" },
                  { label: "Center", value: "center" },
                  { label: "Right", value: "right" },
                ],
              },
            ],
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
                    caption: "Image caption",
                  },
                },
                fields: [
                  {
                    name: "src",
                    label: "Image Source",
                    type: "image",
                    required: true,
                  },
                  {
                    name: "alt",
                    label: "Alt Text",
                    type: "string",
                  },
                  {
                    name: "caption",
                    label: "Caption",
                    type: "string",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // search: {
  //   tina: {
  //     indexerToken: '28d0e10f1b36319d510fa12d1bed025cdbfb2460',
  //     stopwordLanguages: ['eng'],
  //   },
  //   indexBatchSize: 100,
  //   maxSearchIndexFieldLength: 100,
  // },
  
});
