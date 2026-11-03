import { serverSupabaseClient } from '#supabase/server'
import { sortBy } from 'es-toolkit/compat'
import { omitSensitive } from '../../utils'

// One color and the published keysets that use it (the Colors page drawer)
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const id = Number(event.context.params?.id)

  // `colors.id` is a smallint: a larger id is no color, not a database error
  if (!Number.isInteger(id) || id < 1 || id > 32767) {
    throw createError({ statusCode: 404, statusMessage: 'Color not found.' })
  }

  const { data, error } = await client
    .from('colors')
    .select(
      'id, system, code, name, hex, keysets:keyset_colors(keyset:keysets(id, name, img, profile_keyset_id, start_date, end_date, ic_date, review_status, profile:keyset_profiles(name)))',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Color not found.' })
  }

  // Keysets under review stay in the review queue, as on the catalog pages
  const keysets = data.keysets
    .map(({ keyset }) => keyset)
    .filter(
      (keyset) =>
        keyset &&
        (!keyset.review_status || keyset.review_status === 'Approved'),
    )
    .map(({ review_status: _, ...keyset }) => keyset)

  return {
    ...omitSensitive(data),
    // Newest first: the group buy, else the interest check
    keysets: sortBy(keysets, [
      (keyset) => keyset.start_date || keyset.ic_date || '',
    ]).reverse(),
  }
})
