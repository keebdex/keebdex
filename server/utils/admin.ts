import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createError } from 'h3'
import type { H3Event } from 'h3'

export const requireAdminClient = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  const { data: actor, error: actorError } = await client
    .from('users')
    .select('role')
    .eq('id', user.sub)
    .single()

  if (actorError) {
    throw createError({
      statusCode: 500,
      statusMessage: actorError.message,
    })
  }

  if (!actor || actor.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return client
}
