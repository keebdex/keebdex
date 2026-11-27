import type { KeebModule } from '~/utils/keeb-modules'

type UploadableFile = File | File[] | null | undefined

function getSingleFile(file: UploadableFile): File | null {
  if (!file) return null
  if (Array.isArray(file)) return file[0] || null
  return file
}

export function getMaxUploadSizeMb(category: KeebModule) {
  const config = useRuntimeConfig()
  const maxSizeMap = config.public.upload?.max_image_size || {}

  return Number(maxSizeMap[category]) || 10
}

/**
 * The image formats uploads accept: the one list behind the file picker, the
 * client's early check, and the server's check of the file's real bytes
 * (`server/utils/image-type.ts`). No AVIF (Cloudflare Images takes it as input
 * on Enterprise only) and no SVG (it can carry scripts).
 */
export const IMAGE_UPLOAD_FORMATS = [
  { label: 'JPEG', mimes: ['image/jpeg'], extensions: ['jpg', 'jpeg'] },
  { label: 'PNG', mimes: ['image/png'], extensions: ['png'] },
  { label: 'GIF', mimes: ['image/gif'], extensions: ['gif'] },
  { label: 'WebP', mimes: ['image/webp'], extensions: ['webp'] },
  {
    label: 'HEIC',
    mimes: ['image/heic', 'image/heif'],
    extensions: ['heic', 'heif'],
  },
] as const

export type ImageUploadFormat = (typeof IMAGE_UPLOAD_FORMATS)[number]

const IMAGE_UPLOAD_MIMES: readonly string[] = IMAGE_UPLOAD_FORMATS.flatMap(
  (format) => format.mimes,
)

const IMAGE_UPLOAD_EXTENSIONS: readonly string[] = IMAGE_UPLOAD_FORMATS.flatMap(
  (format) => format.extensions,
)

/** The file picker's `accept`: every MIME type, then every extension. */
export const IMAGE_UPLOAD_ACCEPT = [
  ...IMAGE_UPLOAD_MIMES,
  ...IMAGE_UPLOAD_EXTENSIONS.map((extension) => `.${extension}`),
].join(',')

/** "JPEG, PNG, GIF, WebP, or HEIC" */
export const IMAGE_UPLOAD_FORMATS_LABEL = [
  IMAGE_UPLOAD_FORMATS.slice(0, -1)
    .map((format) => format.label)
    .join(', '),
  IMAGE_UPLOAD_FORMATS.at(-1)?.label,
].join(', or ')

export const IMAGE_UPLOAD_FORMATS_ERROR = `Only ${IMAGE_UPLOAD_FORMATS_LABEL} images are allowed`

// Early feedback only; the server checks the file's real bytes
function isAllowedImageFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''

  return (
    IMAGE_UPLOAD_MIMES.includes(file.type) ||
    IMAGE_UPLOAD_EXTENSIONS.includes(extension)
  )
}

function validateImageFile(file: File, category: KeebModule) {
  if (!isAllowedImageFile(file)) {
    throw new Error(IMAGE_UPLOAD_FORMATS_ERROR)
  }

  const maxSizeMb = getMaxUploadSizeMb(category)
  const maxSizeBytes = maxSizeMb * 1024 * 1024

  if (file.size > maxSizeBytes) {
    throw new Error(`Image file size must be less than ${maxSizeMb}MB`)
  }
}

export async function uploadImageToCloudflare(options: {
  file: UploadableFile
  assignment: string
  category: KeebModule
}) {
  const selectedFile = getSingleFile(options.file)

  if (!selectedFile) {
    throw new Error('Please select an image file to upload')
  }

  const assignment = String(options.assignment || '').trim()

  if (!assignment) {
    throw new Error('Missing upload assignment')
  }

  validateImageFile(selectedFile, options.category)

  const formData = new FormData()
  formData.append('file', selectedFile, selectedFile.name)
  formData.append('assignment', assignment)
  formData.append('category', options.category)

  const result = await $fetch<{ url?: string }>('/api/images/upload', {
    method: 'post',
    body: formData,
  })

  if (!result?.url) {
    throw new Error('Cloudflare image upload failed')
  }

  return result.url
}
