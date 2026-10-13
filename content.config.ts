import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // One file per release (`content/changelog/v<version>.md`), written by
    // `bun run release` from the `[Unreleased]` section of CHANGELOG.md.
    // GitHub releases are published from these files.
    changelog: defineCollection({
      source: 'changelog/*.md',
      type: 'page',
      schema: z.object({
        version: z.string(),
        date: z.date(),
        prerelease: z.boolean().default(false),
        author: z.string().optional(),
      }),
    }),
  },
})
