import { serverSupabaseClient } from '#supabase/server'
import sortBy from 'lodash.sortby'
import { omitSensitive } from '../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { brand: brand_slug, keyboard: keyboard_slug } =
    event.context.params || {}
  const brandKeyboardSlug = `${brand_slug}/${keyboard_slug}`

  const { data, error } = await client
    .from('keyboards')
    .select(
      '*, brand:keyboard_brands!inner(*), keyboard_releases(*, keyboard_variants(*))',
    )
    .eq('brand_keyboard_slug', brandKeyboardSlug)
    .eq('brand_slug', brand_slug)
    .single()

  if (error) {
    throw createError({
      statusCode: 404,
      statusMessage: error.message,
    })
  }

  const { brand, keyboard_releases, ...keyboard } = data
  const releases = sortBy(keyboard_releases, 'order').reverse()

  const coverImage = releases
    .flatMap((release: any) => release.keyboard_variants)
    .find((variant: any) => variant.image_url)?.image_url

  let original: any = null

  if (keyboard?.derived_from) {
    const { data: foundation } = await client
      .from('keyboards')
      .select('*, brand:keyboard_brands(name, slug)')
      .eq('brand_keyboard_slug', keyboard.derived_from)
      .maybeSingle()

    if (foundation) {
      original = omitSensitive(foundation)
    }
  }

  return {
    ...omitSensitive(keyboard),
    cover_image: coverImage || null,
    original,
    brand: omitSensitive(brand),
    releases: releases.map((release: any) => ({
      ...omitSensitive(release),
      variants: sortBy(release.keyboard_variants, 'id').map(omitSensitive),
    })),
  }
})
