import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // One file per release (`content/changelog/v<version>.md`), plus the
    // notes for the next release in `unreleased.md` (no version or date),
    // which `bun run release` turns into a release file. GitHub releases are
    // published from these files.
    changelog: defineCollection({
      source: 'changelog/*.md',
      type: 'page',
      schema: z.object({
        version: z.string().optional(),
        date: z.date().optional(),
        prerelease: z.boolean().default(false),
        // A GitHub username, or a name with an optional icon (and its CSS
        // color) or avatar URL and link for co-authors without a GitHub account.
        authors: z
          .array(
            z.union([
              z.string(),
              z.object({
                name: z.string(),
                icon: z.string().optional(),
                color: z.string().optional(),
                avatar: z.string().optional(),
                to: z.string().optional(),
              }),
            ]),
          )
          .optional(),
      }),
    }),
  },
})
