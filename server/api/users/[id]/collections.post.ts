import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (user.sub !== event.context.params?.id)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const client = await serverSupabaseClient(event)

  const body = pickTableFields('user_collections', await readBody(event))

  // A new collection always belongs to the session user
  const { data, error } = await client
    .from('user_collections')
    .insert({ ...body, uid: user.sub })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
