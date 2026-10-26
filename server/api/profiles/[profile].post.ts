import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../../utils'

/**
 * Updates a keyset profile (staff of the profile: admins and editors without
 * assignments, through RLS). Profiles are added in the database, so an
 * unknown profile is a 404, and RLS refusing the update a 403.
 */
export default defineEventHandler(async (event) => {
  const profileId = event.context.params?.profile
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('keyset_profiles', await readBody(event), [
    'id',
    'profile_id',
  ])

  const { data: existing } = await client
    .from('keyset_profiles')
    .select('profile_id')
    .eq('profile_id', profileId!)
    .maybeSingle()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  const { data, error } = await client
    .from('keyset_profiles')
    .update(body)
    .eq('profile_id', profileId!)
    .select()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  if (!data?.length) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to change this profile.',
    })
  }

  return omitSensitive(data[0])
})
