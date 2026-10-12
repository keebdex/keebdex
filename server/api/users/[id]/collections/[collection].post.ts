import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (user.sub !== event.context.params?.id)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const client = await serverSupabaseClient(event)
  // Ownership and identity never change through this endpoint
  const {
    id: _id,
    uid: _uid,
    ...body
  } = pickTableFields('user_collections', await readBody(event))

  const { data, error } = await client
    .from('user_collections')
    .update(body)
    .eq('id', event.context.params?.collection)
    .eq('uid', user.sub)
    .select('id')

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  // RLS filters silently, so an empty result means nothing was saved
  if (!data?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Collection not found',
    })
  }

  return data
})
