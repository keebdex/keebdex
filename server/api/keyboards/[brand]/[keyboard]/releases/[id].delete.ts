import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Release ID is required',
    })
  }

  // Check if release has variants
  const { count, error: countError } = await client
    .from('keyboard_variants')
    .select('id', { count: 'exact', head: true })
    .eq('release_id', id)

  if (countError) {
    throw createError({
      statusCode: 500,
      statusMessage: countError.message,
    })
  }

  if (count && count > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot delete release with variants',
    })
  }

  const { error } = await client.from('keyboard_releases').delete().eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return { success: true }
})
