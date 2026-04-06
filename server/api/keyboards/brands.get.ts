import { serverSupabaseClient } from '#supabase/server'
import sortBy from 'lodash.sortby'
import { omitSensitive } from '../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('keyboard_brands')
    .select('*, keyboards(id, keyboard_releases(id))')

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return sortBy(
    (data || []).map((brand: any) => {
      const keyboards = brand.keyboards || []
      const releases = keyboards.flatMap(
        (keyboard: any) => keyboard.keyboard_releases || [],
      )

      return {
        ...omitSensitive(brand),
        keyboard_count: keyboards.length,
        release_count: releases.length,
      }
    }),
    'name',
  )
})
