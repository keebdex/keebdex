import { serverSupabaseClient } from '#supabase/server'
import sortBy from 'lodash.sortby'
import { omitSensitive } from '../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data } = await client.from('makers').select()

  return sortBy(data?.map(omitSensitive), 'id')
})
