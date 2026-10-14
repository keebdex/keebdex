import { serverSupabaseClient } from '#supabase/server'
import sortBy from 'lodash.sortby'
import { getRandomCoverImage, omitSensitive } from '../../../utils'

export default defineEventHandler(async (event) => {
  const { brand: brand_slug } = event.context.params || {}
  const client = await serverSupabaseClient(event)

  const { data: brandData, error: brandError } = await client
    .from('keyboard_brands')
    .select(
      '*, keyboards(*, keyboard_releases(keyboard_variants(img_front, img_back)))',
    )
    .eq('slug', brand_slug)
    .single()

  if (brandError) {
    throw createError({
      statusCode: 404,
      statusMessage: brandError.message,
    })
  }

  const { keyboards, ...brand } = brandData

  return {
    ...omitSensitive(brand),
    keyboards: sortBy(
      (keyboards || []).map((keyboard: any) => {
        // Releases are fetched only to pick a cover; the page never reads them
        const { keyboard_releases: releases, ...rest } = keyboard
        const variants = (releases || []).flatMap(
          (release: any) => release.keyboard_variants || [],
        )

        return {
          ...omitSensitive(rest),
          cover_image: getRandomCoverImage(variants),
        }
      }),
      'name',
    ),
  }
})
