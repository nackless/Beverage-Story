// Import the glob loader
import { glob } from "astro/loaders";

// Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";

// Define a `loader` and `schema` for each collection
const posts = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/pages/posts" }),
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.date(),
      slug: z.string(),
      author: z.string(),
      image: z.object({
        url: z.string(),
        alt: z.string()
      }).optional(),
      tags: z.array(z.string())
    })
});

// Export a single `collections` object to register your collection(s)
export const collections = { posts };