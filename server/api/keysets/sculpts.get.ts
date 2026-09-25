import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { term } = getQuery(event)

  const searchTerm = String(term || '').trim()

  if (searchTerm.length < 2) {
    return { sculpts: [] }
  }

  const { data, error } = await client
    .from('keysets')
    .select('sculpt')
    .not('sculpt', 'is', null)
    .neq('sculpt', '')
    .ilike('sculpt', `%${searchTerm}%`)
    .order('sculpt')
    .limit(20)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const seen = new Set<string>()

  const sculpts = data.reduce<string[]>((acc, { sculpt }) => {
    if (!sculpt) {
      return acc
    }

    const normalized = sculpt.toLowerCase()

    if (seen.has(normalized)) {
      return acc
    }

    seen.add(normalized)
    acc.push(sculpt)
    return acc
  }, [])

  return { sculpts }
})
