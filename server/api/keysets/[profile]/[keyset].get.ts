import { serverSupabaseClient } from '#supabase/server'
import sortBy from 'lodash.sortby'
import { omitSensitive } from '../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { params } = event.context

  const { data, error } = await client
    .from('keysets')
    .select(
      '*, kits:keyset_kits(*, category:kit_categories(name)), colors:keyset_colors(*, color:colors(*)), profile:keyset_profiles(name)',
    )
    // .select('*, artisans:artisan_colorways(*), kits:keyset_kits(*)')
    .eq('profile_keyset_id', `${params?.profile}/${params?.keyset}`)
    .single()

  if (error) {
    throw createError({
      statusCode: 404,
      statusMessage: error.message,
    })
  }

  // Submitters and staff can read kits still under review, but the keyset page
  // only lists official ones (null/Approved); the rest live in the review queue.
  if (data && Array.isArray(data.kits)) {
    data.kits = sortBy(
      data.kits.filter(
        (kit: any) => !kit.review_status || kit.review_status === 'Approved',
      ),
      'id',
    )
  }

  // // get unique maker_id
  // const makerIds = [...new Set(data.artisans.map((a) => a.maker_id))]

  // const { data: makers } = await client
  //     .from('artisan_makers')
  //     .select()
  //     .in('id', makerIds)

  // const { data: sculpts } = await client
  //     .from('artisan_sculpts')
  //     .select()
  //     .in('maker_id', makerIds)

  // const makerMap = keyBy(makers, 'id')
  // const sculptMap = keyBy(sculpts, (s) => `${s.maker_id}/${s.sculpt_id}`)

  // data.artisans.forEach((cap) => {
  //     cap.maker_name = makerMap[cap.maker_id].name
  //     cap.sculpt_name = sculptMap[`${cap.maker_id}/${cap.sculpt_id}`].name
  // })

  return omitSensitive(data)
})
