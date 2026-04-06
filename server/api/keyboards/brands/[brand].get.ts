import { serverSupabaseClient } from '#supabase/server'
import sortBy from 'lodash.sortby'

export default defineEventHandler(async (event) => {
  const brandSlug = event.context.params?.brand
  const client = await serverSupabaseClient(event)

  const { data: brand, error: brandError } = await client
    .from('keyboard_brands')
    .select('*')
    .eq('slug', brandSlug)
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
    .eq('brand_slug', brandSlug)

  if (keyboardsError) {
    throw createError({
      statusCode: 500,
      statusMessage: keyboardsError.message,
    })
  }

  return {
    ...brand,
    keyboards: sortBy(
      (keyboards || []).map((keyboard: any) => {
        const releases = keyboard.keyboard_releases || []
        const variants = releases.flatMap(
          (release: any) => release.keyboard_variants || [],
        )
        const variantCount = releases.reduce(
          (sum: number, release: any) =>
            sum + (release.keyboard_variants || []).length,
          0,
        )
        const coverImage = variants.find(
          (variant: any) => variant.image_url,
        )?.image_url

        return {
          ...keyboard,
          release_count: releases.length,
          variant_count: variantCount,
          cover_image: coverImage || null,
        }
      }),
      'name',
    ),
  }
})
