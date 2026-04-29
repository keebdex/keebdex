import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const query: Record<string, any> = getQuery(event)
  const page = Number(query.page) || 1
  const size = Number(query.size) || 20
  const system = query.system?.toString().trim()
  const term = query.term?.toString().trim()

  const from = (page - 1) * size
  const to = page * size - 1

  let dbQuery = client.from('colors').select('*', { count: 'exact' })

  if (system) {
    dbQuery = dbQuery.eq('system', system)
  }

  if (term) {
    const fts = term.split(/[\s,\t,\n]+/).join(' | ')

    dbQuery = dbQuery.textSearch('fts', fts)
  }

  const { data, count, error } = await dbQuery
    .range(from, to)
    .order('system', { ascending: true })
    .order('code', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return {
    data: data?.map(omitSensitive) || [],
    count: count || 0,
    page,
    size,
  }
})
