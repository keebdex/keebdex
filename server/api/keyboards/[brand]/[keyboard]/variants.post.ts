import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const keyboardSlug = event.context.params?.keyboard
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)

  if (!body?.release_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Release is required',
    })
  }

  const { error: releaseError } = await client
    .from('keyboard_releases')
    .select('id')
    .eq('id', body.release_id)
    .eq('keyboard_slug', keyboardSlug)
    .single()

  if (releaseError) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Release not found for this keyboard',
    })
  }

  const payload = {
    ...body,
    release_id: Number(body.release_id),
    msrp_price:
      body.msrp_price === '' || body.msrp_price === null
        ? null
        : Number(body.msrp_price),
    units_produced:
      body.units_produced === '' || body.units_produced === null
        ? null
        : Number(body.units_produced),
    currency: body.currency || 'USD',
  }

  let result

  if (body.id) {
    result = await client
      .from('keyboard_variants')
      .update(payload)
      .eq('id', body.id)
      .select()
      .single()
  } else {
    result = await client
      .from('keyboard_variants')
      .insert(payload)
      .select()
      .single()
  }

  if (result.error) {
    throw createError({
      statusCode: 500,
      statusMessage: result.error.message,
    })
  }

  return result.data
})
