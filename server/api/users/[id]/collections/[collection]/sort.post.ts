import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const body = await readBody(event)

  const updates = body.map(async (item: { id: any; order: any }) => {
    const { id, order } = item

    const { error } = await client
      .from('user_collection_items')
      .update({ order })
      .eq('id', id)

    if (error) {
      throw error
    }
  })

  await Promise.all(updates)

  return { success: true }
})
