/**
 * The image formats uploads accept, shared by the client (file picker, early
 * check) and the server (`server/utils/image-type.ts`), so it has no imports or
 * runtime calls. `mime`/`ext` are what the server forwards to Cloudflare;
 * `mimes`/`extensions` are everything the picker accepts. No AVIF (Cloudflare
 * Images takes it as input on Enterprise only) and no SVG (it can carry
 * scripts).
 */
export const IMAGE_UPLOAD_FORMATS = {
  jpeg: {
    mime: 'image/jpeg',
    ext: 'jpg',
    mimes: ['image/jpeg'],
    extensions: ['jpg', 'jpeg'],
  },
  png: {
    mime: 'image/png',
    ext: 'png',
    mimes: ['image/png'],
    extensions: ['png'],
  },
  gif: {
    mime: 'image/gif',
    ext: 'gif',
    mimes: ['image/gif'],
    extensions: ['gif'],
  },
  webp: {
    mime: 'image/webp',
    ext: 'webp',
    mimes: ['image/webp'],
    extensions: ['webp'],
  },
  heic: {
    mime: 'image/heic',
    ext: 'heic',
    mimes: ['image/heic', 'image/heif'],
    extensions: ['heic', 'heif'],
  },
} as const

export type ImageUploadFormat =
  (typeof IMAGE_UPLOAD_FORMATS)[keyof typeof IMAGE_UPLOAD_FORMATS]

const formats = Object.values(IMAGE_UPLOAD_FORMATS)
const mimes: readonly string[] = formats.flatMap((format) => format.mimes)
const extensions: readonly string[] = formats.flatMap(
  (format) => format.extensions,
)

/** The file picker's `accept`: every MIME type, then every extension. */
export const IMAGE_UPLOAD_ACCEPT = [
  ...mimes,
  ...extensions.map((extension) => `.${extension}`),
].join(',')

export const IMAGE_UPLOAD_FORMATS_LABEL = 'JPEG, PNG, GIF, WebP, or HEIC'

export const IMAGE_UPLOAD_FORMATS_ERROR = `Only ${IMAGE_UPLOAD_FORMATS_LABEL} images are allowed`

/** Early feedback only; the server checks the file's real bytes. */
export function isAllowedImageFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''

  return mimes.includes(file.type) || extensions.includes(extension)
}
