import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing user id',
    })
  }

  if (user.sub !== id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    })
  }

  const body = await readBody(event)
  if (
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    ('role' in body || 'assignments' in body)
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Role and assignments can only be changed by admins',
    })
  }

  const client = await serverSupabaseClient(event)
  const payload = pickTableFields('users', body)

  const { data, error } = await client
    .from('users')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
