import type { Enums } from '~/types/database.types'

type UploadImageCategory = Lowercase<Enums<'module'>>

type UploadableFile = File | File[] | null | undefined

function getSingleFile(file: UploadableFile): File | null {
  if (!file) return null
  if (Array.isArray(file)) return file[0] || null
  return file
}

function getMaxUploadSizeMb(category: UploadImageCategory) {
  const config = useRuntimeConfig()
  const maxSizeMap = config.public.upload?.max_image_size || {}

  return Number(maxSizeMap[category]) || 5
}

function validateImageFile(file: File, category: UploadImageCategory) {
  if (!file.type?.startsWith('image/')) {
    throw new Error('Only image files are allowed')
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
  category: UploadImageCategory
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
