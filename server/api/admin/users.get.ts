import { createError, defineEventHandler, getQuery } from 'h3'
import { requireAdminClient } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const size = Math.min(Math.max(Number(query.size) || 20, 1), 100)
  const term = String(query.term || '').trim()
  const role = String(query.role || '').trim()

  const from = (page - 1) * size
  const to = from + size - 1

  let request = client
    .from('users')
    .select('id, full_name, email, role, supporter, assignments, discord, reddit, qq', {
      count: 'exact',
    })
    .order('email')
    .range(from, to)

  if (term) {
    // Quoted, so commas and parentheses in the term cannot add filters to
    // the `or`; `%`, `_` and `\` match literally instead of as wildcards.
    const like = term.replace(/[\\%_]/g, '\\$&')
    const pattern = `"%${like.replace(/["\\]/g, '\\$&')}%"`
    request = request.or(
      `email.ilike.${pattern},full_name.ilike.${pattern},discord.ilike.${pattern}`,
    )
  }

  // `supporter` filters by the Supporter badge, any other value by role
  if (role === 'supporter') {
    request = request.eq('supporter', true)
  } else if (role !== 'all' && role) {
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
    data: data || [],
    count: count || 0,
    page,
    size,
  }
})
