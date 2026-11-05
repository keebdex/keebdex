// Pages rendered on the client only (`ssr: false` in routeRules) send an
// empty shell, so link previews of them had no title or image. This adds
// the social preview tags to that shell from the server, without rendering
// the page: the page's own title and description (keep them in sync with
// its `useSeoMeta`) and the site's `Base` OG image with that title. The
// page's own `useSeoMeta` still sets the tab title once it mounts.
const SPA_PAGES: Record<string, { title: string, description: string }> = {
  '/collection': {
    title: 'My Collection',
    description:
      'Manage and showcase your personal artisan, keycap, and keyboard collections in one place.',
  },
  '/artisan/marketplace': {
    title: 'Trading Hub',
    description: 'Find buyers and sellers for artisan keycaps.',
  },
  '/artisan/wishlist': {
    title: 'Wishlist',
    description:
      'Quickly generate visual wishlists for buying & selling. Share on Discord, social media, and more.',
  },
  '/artisan/submissions': {
    title: 'Artisan Submissions',
    description: 'Review artisan makers, sculpts, and colorways sent in by the community.',
  },
  '/artisan/submissions/submit': {
    title: 'Submit an Artisan',
    description: 'Add an artisan maker, sculpt, or colorway to Keebdex.',
  },
  '/keyboard/submissions': {
    title: 'Keyboard Submissions',
    description: 'Review keyboard brands, keyboards, and releases sent in by the community.',
  },
  '/keyboard/submissions/submit': {
    title: 'Submit a Keyboard',
    description: 'Add a keyboard brand, keyboard, or release to Keebdex.',
  },
  '/keyset/submissions': {
    title: 'Keyset Submissions',
    description: 'Review keyset profiles, keysets, and kits sent in by the community.',
  },
  '/keyset/submissions/submit': {
    title: 'Submit a Keyset',
    description: 'Add a keyset profile, keyset, or kit to Keebdex.',
  },
}

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const path = getRequestURL(event).pathname.replace(/\/+$/, '') || '/'
    const page = SPA_PAGES[path]
    if (!page) return

    const { name } = useRuntimeConfig(event).public.site
    const title = `${page.title} - ${name}`
    const image = getOgImageUrl(event, path, {
      component: 'Base',
      props: { title: page.title },
    })

    const meta = [
      ['property', 'og:type', 'website'],
      ['property', 'og:site_name', name],
      ['property', 'og:title', title],
      ['property', 'og:description', page.description],
      ['property', 'og:image', image],
      ['property', 'og:image:type', 'image/png'],
      ['property', 'og:image:width', '1200'],
      ['property', 'og:image:height', '600'],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:image', image],
    ]

    html.head.push(
      `<title>${escapeAttr(title)}</title>`,
      ...meta.map(
        ([key, value, content]) =>
          `<meta ${key}="${value}" content="${escapeAttr(content!)}">`,
      ),
    )
  })
})
