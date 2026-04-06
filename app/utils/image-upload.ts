const MAX_IMAGE_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

type UploadableFile = File | File[] | null | undefined

function getSingleFile(file: UploadableFile): File | null {
  if (!file) return null
  if (Array.isArray(file)) return file[0] || null
  return file
}

function validateImageFile(file: File) {
  if (!file.type?.startsWith('image/')) {
    throw new Error('Only image files are allowed')
  }

  if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    throw new Error('Image file size must be less than 10MB')
  }
}

export async function uploadImageToCloudflare(options: {
  file: UploadableFile
  assignment: string
}) {
  const selectedFile = getSingleFile(options.file)

  if (!selectedFile) {
    throw new Error('Please select an image file to upload')
  }

  const assignment = String(options.assignment || '').trim()

  if (!assignment) {
    throw new Error('Missing upload assignment')
  }

  validateImageFile(selectedFile)

  const formData = new FormData()
  formData.append('file', selectedFile, selectedFile.name)
  formData.append('assignment', assignment)

  const result = await $fetch<{ url?: string }>('/api/images/upload', {
    method: 'post',
    body: formData,
  })

  if (!result?.url) {
    throw new Error('Cloudflare image upload failed')
  }

  return result.url
}
