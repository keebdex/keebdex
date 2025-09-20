import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const query: Record<string, any> = getQuery(event)
  const { page, size } = query

  const from = (page - 1) * size
  const to = page * size - 1

  const fts = query.term
    ?.toString()
    .trim()
    .split(/[\s,\t,\n]+/) // split and remove more than 1 space
    .join(' | ')

  const { data, count } = Object.hasOwn(query, 'term')
    ? await client.from('colors').select().textSearch('fts', `${fts}`)
    : await client
        .from('colors')
        .select('*', { count: 'exact' })
        .range(from, to)

  return {
    colors: data?.map(omitSensitive),
    count,
  }
})
