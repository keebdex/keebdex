import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const ALLOWED_ROLES = new Set(['admin', 'editor', 'maker'])

interface CloudflareImageUploadResponse {
  success: boolean
  errors?: Array<{ message?: string }>
  result?: {
    id?: string
    variants?: string[]
  }
}

function isAuthorizedEditor(
  profile: { role?: string | null; assignments?: string[] | null },
  makerId: string,
) {
  if (!profile.role || !ALLOWED_ROLES.has(profile.role)) {
    return false
  }

  if (profile.role === 'admin') {
    return true
  }

  if (profile.role === 'editor') {
    return !profile.assignments || profile.assignments.includes(makerId)
  }

  if (profile.role === 'maker') {
    return !!profile.assignments && profile.assignments.includes(makerId)
  }

  return false
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const formData = await readFormData(event)

  const file = formData.get('file')
  const makerId = String(formData.get('maker_id') || '')

  if (!(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing image file' })
  }

  if (!makerId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing maker id' })
  }

  if (!file.type?.startsWith('image/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only image files are allowed',
    })
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image file size must be less than 5MB',
    })
  }

  const client = await serverSupabaseClient(event)
  const { data: profile } = await client
    .from('users')
    .select('role, assignments')
    .eq('id', user.sub)
    .single()

  if (!profile || !isAuthorizedEditor(profile, makerId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Insufficient permissions',
    })
  }

  const config = useRuntimeConfig(event)
  const accountId = config.cloudflare?.accountId
  const apiToken = config.cloudflare?.imagesApiToken

  if (!accountId || !apiToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cloudflare Images is not configured',
    })
  }

  const body = new FormData()
  body.append('file', file, file.name)

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

  const deliveryBase = config.cloudflare?.imagesDeliveryBaseUrl?.replace(
    /\/$/,
    '',
  )
  const variant = config.cloudflare?.imagesDefaultVariant || 'public'

  const imageUrl = deliveryBase
    ? `${deliveryBase}/${response.result.id}/${variant}`
    : response.result.variants?.[0]

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
