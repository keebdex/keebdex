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
    .find((variant: any) => variant.img_front)?.img_front

  let original: any = null
  let derivations: any[] = []

  if (keyboard?.derived_from) {
    const { data: foundation } = await client
      .from('keyboards')
      .select('*, brand:keyboard_brands(name, slug)')
      .eq('brand_keyboard_slug', keyboard.derived_from)
      .maybeSingle()

    if (foundation) {
      original = omitSensitive(foundation)
    }
  } else {
    const { data } = await client
      .from('keyboards')
      .select(
        '*, brand:keyboard_brands(name, slug, invertible_logo), keyboard_releases(*, keyboard_variants(id, img_front, img_back))',
      )
      .eq('derived_from', brandKeyboardSlug)
      .order('name', { ascending: true })

    if (data?.length) {
      derivations = data.map((item: any) => {
        const {
          brand: derivedBrand,
          keyboard_releases: derivedReleases,
          ...derivedKeyboard
        } = item

        const derivedCoverImage = (derivedReleases || [])
          .flatMap((release: any) => release.keyboard_variants || [])
          .find((variant: any) => variant.img_front)?.img_front

        return {
          ...omitSensitive(derivedKeyboard),
          brand: derivedBrand,
          cover_image: derivedCoverImage || null,
        }
      })
    }
  }

  return {
    ...omitSensitive(keyboard),
    cover_image: coverImage || null,
    original,
    derived_keyboards: derivations,
    brand: omitSensitive(brand),
    releases: releases.map((release: any) => ({
      ...omitSensitive(release),
      variants: sortBy(release.keyboard_variants, 'id').map(omitSensitive),
    })),
  }
})
