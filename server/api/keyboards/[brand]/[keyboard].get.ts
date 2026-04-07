import { serverSupabaseClient } from '#supabase/server'
import groupBy from 'lodash.groupby'
import { omitSensitive } from '../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { brand: brand_slug, keyboard: keyboard_slug } =
    event.context.params || {}
  const brandKeyboardSlug = `${brand_slug}/${keyboard_slug}`

  const { data: keyboard, error: keyboardError } = await client
    .from('keyboards')
    .select('*')
    .eq('brand_keyboard_slug', brandKeyboardSlug)
    .single()

  if (keyboardError) {
    throw createError({
      statusCode: 404,
      statusMessage: keyboardError.message,
    })
  }

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

  const { data: releases, error: releasesError } = await client
    .from('keyboard_releases')
    .select('*')
    .eq('brand_keyboard_slug', brandKeyboardSlug)
    .order('order', { ascending: false })

  if (releasesError) {
    throw createError({
      statusCode: 500,
      statusMessage: releasesError.message,
    })
  }

  const releaseIds = (releases || []).map((release: any) => release.id)

  let variants: any[] = []

  if (releaseIds.length) {
    const { data: variantsData, error: variantsError } = await client
      .from('keyboard_variants')
      .select('*')
      .in('release_id', releaseIds)
      .order('id', { ascending: false })

    if (variantsError) {
      throw createError({
        statusCode: 500,
        statusMessage: variantsError.message,
      })
    }

    variants = variantsData || []
  }

  const variantsByRelease = groupBy(variants, 'release_id')
  const coverImage = variants.find(
    (variant: any) => variant.image_url,
  )?.image_url

  let parent: any = null

  if (keyboard?.parent_slug) {
    const { data: parentKeyboard } = await client
      .from('keyboards')
      .select('name, slug, brand_slug, brand:keyboard_brands(name, slug)')
      .eq('brand_keyboard_slug', keyboard.parent_slug)
      .maybeSingle()

    if (parentKeyboard) {
      parent = {
        ...omitSensitive(parentKeyboard),
        brand_keyboard_slug: keyboard.parent_slug,
      }
    }
  }

  return {
    brand: omitSensitive(brand),
    keyboard: {
      ...omitSensitive(keyboard),
      cover_image: coverImage || null,
      parent,
    },
    releases: (releases || []).map((release: any) => ({
      ...omitSensitive(release),
      variants: (variantsByRelease[release.id] || []).map((variant: any) =>
        omitSensitive(variant),
      ),
    })),
  }
})
