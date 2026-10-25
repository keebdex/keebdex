import { defineProvider } from '@nuxt/image/runtime'
import { cloudflareImageBase } from '~/utils/image-info'

// Widths a request is rounded up to, so the grids share a few cached
// transformations per image instead of one per computed srcset width
const WIDTHS = [
  160, 240, 320, 400, 480, 560, 640, 800, 960, 1080, 1280, 1600, 1920,
]

// Resizes Keebdex's Cloudflare Images URLs through flexible variants; every
// other source (local placeholders, logos on img.keebdex.org, images on other
// Cloudflare accounts) is returned as is
export default defineProvider({
  getImage(src, { modifiers }) {
    const base = cloudflareImageBase(src)
    const width = Number(modifiers?.width)

    if (!base || !width) {
      return { url: src }
    }

    const size = WIDTHS.find((w) => w >= width) ?? WIDTHS[WIDTHS.length - 1]

    return { url: `${base}/w=${size},fit=scale-down` }
  },
})
