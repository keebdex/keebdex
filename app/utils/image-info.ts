// Stored URLs end with a named variant: `https://imagedelivery.net/<hash>/<id>/public`
// (or `/cdn-cgi/imagedelivery/<hash>/<id>/<variant>` on a custom domain).
// Custom ids may contain slashes, e.g. `keyset/gmk/dinokidz`. The first group
// is the URL without its variant, the second the account hash
const CLOUDFLARE_IMAGE_URL =
  /^(https:\/\/(?:imagedelivery\.net|[^/]+\/cdn-cgi\/imagedelivery)\/([^/]+)\/.+)\/[^/]+$/

// The URL without its variant, only for images on Keebdex's own account
// (`cloudflare.accountHash`): flexible variants and `format=json` are a
// per-account setting, and other accounts (vendor sites) answer them with a
// 403, so their images stay on the stored named variant
export function cloudflareImageBase(src: string) {
  const match = src.match(CLOUDFLARE_IMAGE_URL)
  const { accountHash } = useRuntimeConfig().public.cloudflare

  return match && match[2] === accountHash ? match[1] : null
}

// Images whose longer side is below this many pixels are flagged as low
// resolution in the submission review
export const LOW_RESOLUTION_IMAGE_SIZE = 512

export interface ImageInfo {
  width: number
  height: number
  fileSize?: number
  format?: string
}

const cache = new Map<string, Promise<ImageInfo | null>>()

function loadNaturalSize(src: string) {
  return new Promise<ImageInfo | null>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () =>
      resolve(
        img.naturalWidth
          ? { width: img.naturalWidth, height: img.naturalHeight }
          : null,
      )
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function fetchImageInfo(src: string): Promise<ImageInfo | null> {
  const base = cloudflareImageBase(src)

  // Cloudflare Images describes the original upload as JSON, so the full
  // image is never downloaded just to be measured
  if (base) {
    try {
      const { original } = await $fetch<{
        original: {
          width: number
          height: number
          file_size?: number
          format?: string
        }
      }>(`${base}/format=json`)

      return {
        width: original.width,
        height: original.height,
        fileSize: original.file_size,
        format: original.format,
      }
    } catch {
      // Fall back to measuring the stored image
    }
  }

  return loadNaturalSize(src)
}

// Original dimensions of an image, cached per URL; null when it cannot load
export function getImageInfo(src: string) {
  let info = cache.get(src)

  if (!info) {
    info = fetchImageInfo(src)
    cache.set(src, info)
  }

  return info
}

export function isLowResolution(info: ImageInfo) {
  return Math.max(info.width, info.height) < LOW_RESOLUTION_IMAGE_SIZE
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
