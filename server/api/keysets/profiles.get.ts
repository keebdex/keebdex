import { serverSupabaseClient } from '#supabase/server'
import { omitSensitive } from '../../utils'
import { Constants } from '~/types/database.types'

const groups = new Set(Constants.public.Enums.keyset_profile_group)

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('keyset_profiles')
    .select('*')
    .order('profile')
    .order('name')

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const groupedProfiles = (data || []).reduce<
    Record<string, Record<string, string>>
  >((acc, row) => {
    const group = groups.has(row.profile) ? row.profile : 'Others'

    if (!acc[group]) {
      acc[group] = {}
    }

    acc[group][row.id] = row.name

    return acc
  }, {})

  const manufacturers = (data || []).reduce<Record<string, string>>(
    (acc, row) => {
      acc[row.id] = row.name
      return acc
    },
    {},
  )

  return {
    profiles: data?.map(omitSensitive),
    groupedProfiles,
    manufacturers,
  }
})
