import { defineProvider } from '@nuxt/image/runtime'

// Widths a request is rounded up to, so the grids share a few cached
// transformations per image instead of one per computed srcset width
const WIDTHS = [
  160, 240, 320, 400, 480, 560, 640, 800, 960, 1080, 1280, 1600, 1920,
]

// Stored URLs end with a named variant: `https://imagedelivery.net/<hash>/<id>/public`
// (or `/cdn-cgi/imagedelivery/<hash>/<id>/<variant>` on a custom domain).
// Custom ids may contain slashes, e.g. `keyset/gmk/dinokidz`
const DELIVERY_URL =
  /^(https:\/\/(?:imagedelivery\.net|[^/]+\/cdn-cgi\/imagedelivery)\/[^/]+\/.+)\/[^/]+$/

// Resizes Cloudflare Images URLs through flexible variants; every other
// source (local placeholders, logos on img.keebdex.org) is returned as is
export default defineProvider({
  getImage(src, { modifiers }) {
    const match = src.match(DELIVERY_URL)
    const width = Number(modifiers?.width)

    if (!match || !width) {
      return { url: src }
    }

    const size = WIDTHS.find((w) => w >= width) ?? WIDTHS[WIDTHS.length - 1]

    return { url: `${match[1]}/w=${size},fit=scale-down` }
  },
})
