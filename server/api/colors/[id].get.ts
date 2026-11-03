import { serverSupabaseClient } from '#supabase/server'
import { sortBy } from 'es-toolkit/compat'
import { PUBLISHED_FILTER } from '../../utils'

// One color and the published keysets that use it (the Colors page drawer)
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const id = Number(event.context.params?.id)

  // `colors.id` is a smallint: a larger id is no color, not a database error
  if (!Number.isInteger(id) || id < 1 || id > 32767) {
    throw createError({ statusCode: 404, statusMessage: 'Color not found.' })
  }

  // Keysets under review stay in the review queue, as on the catalog pages
  const { data, error } = await client
    .from('colors')
    .select(
      'id, system, code, name, hex, keysets:keyset_colors(keyset:keysets!inner(id, name, img, profile_keyset_id, start_date, end_date, ic_date, profile:keyset_profiles(name)))',
    )
    .or(PUBLISHED_FILTER, { referencedTable: 'keysets.keyset' })
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Color not found.' })
  }

  return {
    ...data,
    // Newest first: the group buy, else the interest check
    keysets: sortBy(
      data.keysets.map(({ keyset }) => keyset),
      [(keyset) => keyset.start_date || keyset.ic_date || ''],
    ).reverse(),
  }
})
