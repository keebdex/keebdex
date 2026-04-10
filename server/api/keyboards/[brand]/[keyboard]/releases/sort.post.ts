import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { brand, keyboard } = event.context.params || {}
  const body = await readBody(event)

  const updates = body.map(async (item: { id: number; order: number }) => {
    const { id, order } = item

    const { error } = await client
      .from('keyboard_releases')
      .update({ order })
      .eq('id', id)
      .eq('brand_keyboard_slug', `${brand}/${keyboard}`)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      })
    }
  })

  await Promise.all(updates)

  return { success: true }
})
