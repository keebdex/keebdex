import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { detectImageType } from '../../utils/image-type'
import { IMAGE_UPLOAD_FORMATS_ERROR } from '~/utils/image-formats'
import { isKeebModule } from '~/utils/keeb-modules'
import type { KeebModule } from '~/utils/keeb-modules'
import { canManageAssignment } from '~/utils/permissions'

interface CloudflareImageUploadResponse {
  success: boolean
  errors?: Array<{ message?: string }>
  result?: {
    id?: string
    variants?: string[]
  }
}

function resolveUploadLimit(
  config: ReturnType<typeof useRuntimeConfig>,
  category?: KeebModule,
) {
  if (!category) {
    return 5
  }

  const maxSizeMap =
    (config.public.upload?.max_image_size as Partial<
      Record<KeebModule, number>
    >) || {}

  return Number(maxSizeMap[category]) || 10
}

function isAuthorizedUploader(
  profile: { role?: string | null; assignments?: string[] | null } | null,
  assignment: string,
  category: KeebModule,
) {
  // Any authenticated user can upload artisan, keyset, or keyboard images
  // (submissions and edit suggestions); permission for the underlying record
  // is enforced separately when it's saved.
  if (isKeebModule(category)) return true

  return canManageAssignment(profile, assignment)
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // A body that is not valid multipart form data is the caller's mistake
  const formData = await readFormData(event).catch(() => {
    throw createError({ statusCode: 400, statusMessage: 'Invalid form data' })
  })

  const file = formData.get('file')
  const assignment = String(
    formData.get('assignment') || formData.get('maker_id') || '',
  ).trim()
  const category = String(formData.get('category') || '')
    .trim()
    .toLowerCase() as KeebModule

  if (!(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing image file' })
  }

  if (!assignment) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing assignment identifier (e.g. maker_id)',
    })
  }

  // Decide by the file's own bytes; the client's MIME type and name are ignored
  const imageType = await detectImageType(file)

  if (!imageType) {
    throw createError({
      statusCode: 400,
      statusMessage: IMAGE_UPLOAD_FORMATS_ERROR,
    })
  }

  const config = useRuntimeConfig(event)
  const maxSizeMb = resolveUploadLimit(config, category)
  const maxSize = maxSizeMb * 1024 * 1024

  if (file.size > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: `Image file size must be less than ${maxSizeMb}MB`,
    })
  }

  const client = await serverSupabaseClient(event)
  const { data: profile } = await client
    .from('users')
    .select('role, assignments')
    .eq('id', user.sub)
    .single()

  if (!isAuthorizedUploader(profile, assignment, category)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions',
    })
  }

  const accountId = config.cloudflare?.accountId
  const apiToken = config.cloudflare?.imagesApiToken

  if (!accountId || !apiToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cloudflare Images is not configured',
    })
  }

  const body = new FormData()
  // Send the detected type and a server-chosen name, never the client's
  body.append(
    'file',
    new Blob([file], { type: imageType.mime }),
    `upload.${imageType.ext}`,
  )

  const response = await $fetch<CloudflareImageUploadResponse>(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body,
    },
  )

  if (!response.success || !response.result?.id) {
    throw createError({
      statusCode: 502,
      statusMessage:
        response.errors?.[0]?.message || 'Cloudflare image upload failed',
    })
  }

  // Cloudflare lists the image's named variants with the account's own
  // delivery URL, so uploads never depend on a configured hash
  const imageUrl = response.result.variants?.find((url) =>
    url.endsWith('/public'),
  )

  if (!imageUrl) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Cloudflare did not return a usable image URL',
    })
  }

  return {
    id: response.result.id,
    url: imageUrl,
    variants: response.result.variants || [],
  }
})
