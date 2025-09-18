import { serverSupabaseClient } from '#supabase/server'
import sortBy from 'lodash.sortby'
import { omitSensitive } from '../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { params } = event.context

  const { data } = await client
    .from('keycaps')
    .select(
      '*, kits:keycap_kits(*), colors:keycap_colors(*, color:color_codes(*)), profile:keycap_profiles(name)',
    )
    // .select('*, artisans:colorways(*), kits:keycap_kits(*)')
    .eq('profile_keycap_id', `${params?.profile}/${params?.keycap}`)
    .single()

  if (data && Array.isArray(data.kits)) {
    data.kits = sortBy(data.kits, 'id')
  }

  // // get unique maker_id
  // const makerIds = [...new Set(data.artisans.map((a) => a.maker_id))]

  // const { data: makers } = await client
  //     .from('makers')
  //     .select()
  //     .in('id', makerIds)

  // const { data: sculpts } = await client
  //     .from('sculpts')
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
