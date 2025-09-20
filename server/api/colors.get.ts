import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const query = getQuery(event)

  const fts = query.term
    ?.toString()
    .trim()
    .split(/[\s,\t,\n]+/) // split and remove more than 1 space
    .join(' | ')

  const { data } = Object.hasOwn(query, 'term')
    ? await client.from('colors').select().textSearch('fts', `${fts}`)
    : await client.from('colors').select()

  return data
})
