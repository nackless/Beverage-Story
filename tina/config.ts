import { defineConfig } from "tinacms";
import { cloudinaryMediaProvider } from "./cloudinaryMediaProvider";

// Your hosting provider likely exposes this as an environment variable
const branch =
  // process.env.GITHUB_BRANCH ||
  // process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD || "main";

// Cloudinary setup
const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const useCloudinary = cloudName && uploadPreset;

export default defineConfig({
  branch,

  
  clientId: "1efb06e9-53f1-4452-bb54-a224ec8ecc1a", // Get this from tina.io
  token: "72174db5a58ab883954240f0be621c7f37c23ea7", // Get this from tina.io

  media: useCloudinary
    ? {
        provider: cloudinaryMediaProvider,
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
						required: true,
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
