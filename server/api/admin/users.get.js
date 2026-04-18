import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createError, defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
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

  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const size = Math.min(Math.max(Number(query.size) || 20, 1), 100)
  const term = String(query.term || '').trim()
  const role = String(query.role || '').trim()

  const from = (page - 1) * size
  const to = from + size - 1

  let request = client
    .from('users')
    .select('id, full_name, email, role, assignments, discord, reddit, qq', {
      count: 'exact',
    })
    .order('email')
    .range(from, to)

  if (term) {
    request = request.or(
      `email.ilike.%${term}%,full_name.ilike.%${term}%,discord.ilike.%${term}%`,
    )
  }

  if (role !== 'all' && role) {
    request = request.eq('role', role)
  }

  const { data, count, error } = await request

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return {
    users: data || [],
    count: count || 0,
    page,
    size,
  }
})
