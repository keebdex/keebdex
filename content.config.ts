import { defineCollection, defineContentConfig } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    changelog: defineCollection({
      source: 'changelog/*.md',
      type: 'page',
    }),
  },
})
