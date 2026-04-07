import { serverSupabaseClient } from '#supabase/server'
import sortBy from 'lodash.sortby'
import { omitSensitive } from '../../../utils'

export default defineEventHandler(async (event) => {
  const { brand: brand_slug } = event.context.params || {}
  const client = await serverSupabaseClient(event)

  const { data: brand, error: brandError } = await client
    .from('keyboard_brands')
    .select('*')
    .eq('slug', brand_slug)
    .single()

  if (brandError) {
    throw createError({
      statusCode: 404,
      statusMessage: brandError.message,
    })
  }

  const { data: keyboards, error: keyboardsError } = await client
    .from('keyboards')
    .select('*, keyboard_releases(*, keyboard_variants(id, image_url))')
    .eq('brand_slug', brand_slug)

  if (keyboardsError) {
    throw createError({
      statusCode: 500,
      statusMessage: keyboardsError.message,
    })
  }

  return {
    ...omitSensitive(brand),
    keyboards: sortBy(
      (keyboards || []).map((keyboard: any) => {
        const releases = keyboard.keyboard_releases || []
        const variants = releases.flatMap(
          (release: any) => release.keyboard_variants || [],
        )

        const coverImage = variants.find(
          (variant: any) => variant.image_url,
        )?.image_url

        return {
          ...omitSensitive(keyboard),
          cover_image: coverImage || null,
        }
      }),
      'name',
    ),
  }
})
