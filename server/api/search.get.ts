import { serverSupabaseClient } from '#supabase/server'
import { groupByMakerWithChunks } from '../utils/group'

const avatarUi = (invertible: boolean, theme: string | undefined) => {
  return {
    root: 'bg-transparent rounded-none',
    image: invertible && theme === 'dark' && 'invert',
  }
}

const mergeById = (primary: any[] = [], secondary: any[] = []) => {
  const map = new Map()

  for (const item of primary) {
    map.set(item.id, item)
  }

  for (const item of secondary) {
    if (!map.has(item.id)) {
      map.set(item.id, item)
    }
  }

  return Array.from(map.values())
}

const throwIfError = (result: any, label: string) => {
  if (result.error) {
    throw createError({
      statusCode: 500,
      statusMessage: `${label}: ${result.error.message}`,
    })
  }
}

const runCombinedSearch = async ({
  ftsQuery,
  likeQuery,
  label,
}: {
  ftsQuery: any
  likeQuery: any
  label: string
}) => {
  const [ftsResult, likeResult] = await Promise.all([ftsQuery, likeQuery])

  throwIfError(ftsResult, `${label} (fts)`)
  throwIfError(likeResult, `${label} (ilike)`)

  return mergeById(ftsResult.data || [], likeResult.data || [])
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { query, theme } = getQuery(event)

  if (!query) return []

  const fts = query
    ?.toString()
    .trim()
    .split(/[\s,\t,\n]+/) // split and remove more than 1 space
    .join(' | ')

  const queryText = query.toString().trim()

  // Artisan module: combine FTS + ILIKE for makers, sculpts, and colorways.
  const mergedMakers = await runCombinedSearch({
    label: 'Artisan makers',
    ftsQuery: client
      .from('artisan_makers')
      .select()
      .textSearch('fts', `${fts}`)
      .order('id')
      .limit(10),
    likeQuery: client
      .from('artisan_makers')
      .select()
      .or(`name.ilike.%${queryText}%,id.ilike.%${queryText}%`)
      .order('id')
      .limit(10),
  })

  const mergedSculpts = await runCombinedSearch({
    label: 'Artisan sculpts',
    ftsQuery: client
      .from('artisan_sculpts')
      .select('*, maker:artisan_makers(name, invertible_logo)')
      .textSearch('fts', `${fts}`)
      .order('maker_sculpt_id')
      .limit(20),
    likeQuery: client
      .from('artisan_sculpts')
      .select('*, maker:artisan_makers(name, invertible_logo)')
      .or(
        `name.ilike.%${queryText}%,maker_id.ilike.%${queryText}%,sculpt_id.ilike.%${queryText}%`,
      )
      .order('maker_sculpt_id')
      .limit(20),
  })

  const mergedColorways = await runCombinedSearch({
    label: 'Artisan colorways',
    ftsQuery: client
      .from('artisan_colorways')
      .select(
        '*, maker:artisan_makers(id, name, invertible_logo), sculpt:artisan_sculpts(name)',
      )
      .textSearch('fts', `${fts}`)
      .order('maker_sculpt_id')
      .limit(200),
    likeQuery: client
      .from('artisan_colorways')
      .select(
        '*, maker:artisan_makers(id, name, invertible_logo), sculpt:artisan_sculpts(name)',
      )
      .or(
        `name.ilike.%${queryText}%,maker_id.ilike.%${queryText}%,sculpt_id.ilike.%${queryText}%,colorway_id.ilike.%${queryText}%`,
      )
      .order('maker_sculpt_id')
      .limit(200),
  })

  // Keycap module: combine FTS + ILIKE for keycap sets.
  const mergedKeycaps = await runCombinedSearch({
    label: 'Keycap sets',
    ftsQuery: client
      .from('keycaps')
      .select('*, profile:keycap_profiles(name, manufacturer_id)')
      .textSearch('fts', `${fts}`)
      .order('profile_keycap_id')
      .limit(10),
    likeQuery: client
      .from('keycaps')
      .select('*, profile:keycap_profiles(name, manufacturer_id)')
      .or(
        `name.ilike.%${queryText}%,profile_keycap_id.ilike.%${queryText}%,designer.ilike.%${queryText}%`,
      )
      .order('profile_keycap_id')
      .limit(10),
  })

  // Keyboard module: combine FTS + ILIKE for brands, keyboards, releases, and variants.
  const mergedKeyboardBrands = await runCombinedSearch({
    label: 'Keyboard brands',
    ftsQuery: client
      .from('keyboard_brands')
      .select('*')
      .textSearch('fts', `${fts}`)
      .order('slug')
      .limit(10),
    likeQuery: client
      .from('keyboard_brands')
      .select('*')
      .or(`name.ilike.%${queryText}%,slug.ilike.%${queryText}%`)
      .order('slug')
      .limit(10),
  })

  const mergedKeyboards = await runCombinedSearch({
    label: 'Keyboards',
    ftsQuery: client
      .from('keyboards')
      .select('*, brand:keyboard_brands(name, slug)')
      .textSearch('fts', `${fts}`)
      .order('brand_keyboard_slug')
      .limit(20),
    likeQuery: client
      .from('keyboards')
      .select('*, brand:keyboard_brands(name, slug)')
      .or(
        `name.ilike.%${queryText}%,slug.ilike.%${queryText}%,brand_keyboard_slug.ilike.%${queryText}%`,
      )
      .order('brand_keyboard_slug')
      .limit(20),
  })

  const mergedKeyboardReleases = await runCombinedSearch({
    label: 'Keyboard releases',
    ftsQuery: client
      .from('keyboard_releases')
      .select(
        '*, keyboard:keyboards(name, slug), brand:keyboard_brands(name, slug)',
      )
      .textSearch('fts', `${fts}`)
      .order('brand_keyboard_slug')
      .limit(20),
    likeQuery: client
      .from('keyboard_releases')
      .select(
        '*, keyboard:keyboards(name, slug), brand:keyboard_brands(name, slug)',
      )
      .or(`name.ilike.%${queryText}%,description.ilike.%${queryText}%`)
      .order('brand_keyboard_slug')
      .limit(20),
  })

  const mergedKeyboardVariants = await runCombinedSearch({
    label: 'Keyboard variants',
    ftsQuery: client
      .from('keyboard_variants')
      .select(
        '*, release:keyboard_releases(id, name, brand_keyboard_slug), brand:keyboard_brands(name, slug)',
      )
      .textSearch('fts', `${fts}`)
      .order('release_id')
      .limit(20),
    likeQuery: client
      .from('keyboard_variants')
      .select(
        '*, release:keyboard_releases(id, name, brand_keyboard_slug), brand:keyboard_brands(name, slug)',
      )
      .ilike('variant_name', `%${queryText}%`)
      .order('release_id')
      .limit(20),
  })

  return [
    {
      id: 'artisan-maker',
      label: 'Artisan Makers',
      ignoreFilter: true,
      items: mergedMakers.map((m: any) => ({
        id: m.id,
        label: m.name,
        to: `/artisan/maker/${m.id}`,
        avatar: {
          src: `/logo/${m.id}.png`,
          alt: m.name,
          ui: avatarUi(m.invertible_logo, theme?.toString()),
        },
      })),
    },
    {
      id: 'artisan-sculpt',
      label: 'Artisan Sculpts',
      ignoreFilter: true,
      items: mergedSculpts.map((s: any) => ({
        id: s.id,
        label: s.maker.name,
        suffix: s.name,
        to: `/artisan/maker/${s.maker_id}/${s.sculpt_id}`,
        avatar: {
          src: `/logo/${s.maker_id}.png`,
          alt: s.maker.name,
          ui: avatarUi(s.maker.invertible_logo, theme?.toString()),
        },
      })),
    },
    {
      id: 'artisan-colorway',
      label: 'Artisan Colorways',
      ignoreFilter: true,
      items: groupByMakerWithChunks(mergedColorways).map((group, idx) => {
        const { first, last, makers } = group
        const label = `${typeof first === 'number' ? 'Numeric Makers' : 'Alphabet Makers'}: ${first}-${last}`

        return {
          id: `artisan-colorway-${idx}`,
          label,
          icon:
            typeof first === 'number'
              ? 'hugeicons:zero-square'
              : 'hugeicons:text-square',
          children: makers.map(({ maker, items }) => {
            return {
              id: maker.id,
              label: maker.name,
              avatar: {
                src: `/logo/${maker.id}.png`,
                alt: maker.name,
                ui: avatarUi(maker.invertible_logo, theme?.toString()),
              },
              children: items.map((c: any) => ({
                id: c.id,
                label: c.sculpt.name,
                suffix: c.name,
                to: `/artisan/maker/${c.maker_id}/${c.sculpt_id}?cid=${c.colorway_id}`,
              })),
            }
          }),
        }
      }),
    },
    {
      id: 'keycap-set',
      label: 'Keycap Sets',
      ignoreFilter: true,
      items: mergedKeycaps.map((kc: any) => ({
        id: kc.id,
        label: `${kc.profile.name} ${kc.name}`,
        to: `/keycap/${kc.profile_keycap_id}`,
        avatar: {
          src: `/logo/${kc.profile.manufacturer_id}.png`,
          alt: kc.profile.name,
          ui: avatarUi(true, theme?.toString()),
        },
      })),
    },
    {
      id: 'keyboard-brand',
      label: 'Keyboard Brands',
      ignoreFilter: true,
      items: mergedKeyboardBrands.map((brand: any) => ({
        id: brand.id,
        label: brand.name,
        to: `/keyboard/brand/${brand.slug}`,
        avatar: {
          src: `/logo/${brand.slug}.png`,
          alt: brand.name,
          ui: avatarUi(true, theme?.toString()),
        },
      })),
    },
    {
      id: 'keyboard-board',
      label: 'Keyboards',
      ignoreFilter: true,
      items: mergedKeyboards.map((kb: any) => {
        const brandSlug =
          kb.brand_slug ||
          kb.brand?.slug ||
          String(kb.brand_keyboard_slug || '').split('/')[0]

        return {
          id: kb.id,
          label: kb.brand?.name || brandSlug,
          suffix: kb.name,
          to: `/keyboard/brand/${brandSlug}/${kb.slug}`,
          avatar: {
            src: `/logo/${brandSlug}.png`,
            alt: kb.brand?.name || brandSlug,
            ui: avatarUi(true, theme?.toString()),
          },
        }
      }),
    },
    {
      id: 'keyboard-release',
      label: 'Keyboard Releases',
      ignoreFilter: true,
      items: mergedKeyboardReleases.map((release: any) => {
        const [brandSlug, keyboardSlug] = String(
          release.brand_keyboard_slug || '',
        ).split('/')

        return {
          id: release.id,
          label: release.keyboard?.name || keyboardSlug,
          suffix: release.name,
          to: `/keyboard/brand/${brandSlug}/${keyboardSlug}`,
          avatar: {
            src: `/logo/${brandSlug}.png`,
            alt: release.brand?.name || brandSlug,
            ui: avatarUi(true, theme?.toString()),
          },
        }
      }),
    },
    {
      id: 'keyboard-variant',
      label: 'Keyboard Variants',
      ignoreFilter: true,
      items: mergedKeyboardVariants.map((variant: any) => {
        const [brandSlug, keyboardSlug] = String(
          variant.release?.brand_keyboard_slug || '',
        ).split('/')

        return {
          id: variant.id,
          label: variant.release?.name || keyboardSlug,
          suffix: variant.variant_name,
          to: `/keyboard/brand/${brandSlug}/${keyboardSlug}`,
          avatar: {
            src: `/logo/${brandSlug}.png`,
            alt: variant.brand?.name || brandSlug,
            ui: avatarUi(true, theme?.toString()),
          },
        }
      }),
    },
  ].filter((c) => c.items?.length)
})
