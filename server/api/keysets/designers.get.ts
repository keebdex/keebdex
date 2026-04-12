import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { term } = getQuery(event)

  const searchTerm = String(term || '').trim()

  if (searchTerm.length < 2) {
    return { designers: [] }
  }

  const { data, error } = await client
    .from('keysets')
    .select('designer')
    .not('designer', 'is', null)
    .neq('designer', '')
    .ilike('designer', `%${searchTerm}%`)
    .order('designer')
    .limit(20)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const seen = new Set<string>()

  const designers = data.reduce<string[]>((acc, { designer }) => {
    if (!designer) {
      return acc
    }

    const normalized = designer.toLowerCase()

    if (seen.has(normalized)) {
      return acc
    }

    seen.add(normalized)
    acc.push(designer)
    return acc
  }, [])

  return { designers }
})
