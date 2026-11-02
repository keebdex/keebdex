import { CanonicalPlugin, InferSeoMetaPlugin } from '@unhead/vue/plugins'

// Pages set only `title` and `description`: og:title and og:description are
// inferred from them (the title through `titleTemplate`), and the relative
// canonical and og:url set in app.vue resolve against the homepage, without
// query parameters, so every host and filter shares one address. twitter:card
// is set in app.vue, since X reads the rest of a preview from Open Graph.
export default defineNuxtPlugin(() => {
  const head = injectHead()
  const { homepage } = useRuntimeConfig().public.site

  head.use(InferSeoMetaPlugin({ twitterCard: false }))
  head.use(CanonicalPlugin({ canonicalHost: homepage, trailingSlash: false }))
})
