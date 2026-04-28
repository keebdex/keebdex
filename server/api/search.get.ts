import { serverSupabaseClient } from '#supabase/server'

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

  const { term, query, module } = getQuery(event)
  const searchTerm = term || query

  if (!searchTerm) return []

  const modules = String(module || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const isIncluded = (targetModule: string) => {
    if (modules.length) {
      return modules.includes(targetModule)
    }

    return true
  }

  const fts = searchTerm
    ?.toString()
    .trim()
    .split(/[\s,\t,\n]+/) // split and remove more than 1 space
    .join(' | ')

  const queryText = searchTerm.toString().trim()

  const searchTasks: Array<{ key: string; search: Promise<any[]> }> = []

  if (isIncluded('artisan')) {
    searchTasks.push({
      key: 'artisanMakers',
      search: runCombinedSearch({
        label: 'Artisan Makers',
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
      }),
    })

    searchTasks.push({
      key: 'artisanSculpts',
      search: runCombinedSearch({
        label: 'Artisan Sculpts',
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
      }),
    })

    searchTasks.push({
      key: 'artisanColorways',
      search: runCombinedSearch({
        label: 'Artisan Colorways',
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
      }),
    })
  }

  if (isIncluded('keyset')) {
    searchTasks.push({
      key: 'keysets',
      search: runCombinedSearch({
        label: 'Keysets',
        ftsQuery: client
          .from('keysets')
          .select('*, profile:keyset_profiles(name, manufacturer_id)')
          .textSearch('fts', `${fts}`)
          .order('profile_keyset_id')
          .limit(10),
        likeQuery: client
          .from('keysets')
          .select('*, profile:keyset_profiles(name, manufacturer_id)')
          .or(
            `name.ilike.%${queryText}%,profile_keyset_id.ilike.%${queryText}%,designer.ilike.%${queryText}%`,
          )
          .order('profile_keyset_id')
          .limit(10),
      }),
    })
  }

  if (isIncluded('keyboard')) {
    searchTasks.push({
      key: 'keyboardBrands',
      search: runCombinedSearch({
        label: 'Keyboard Brands',
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
      }),
    })

    searchTasks.push({
      key: 'keyboards',
      search: runCombinedSearch({
        label: 'Keyboards',
        ftsQuery: client
          .from('keyboards')
          .select('*, brand:keyboard_brands(name, slug, invertible_logo)')
          .textSearch('fts', `${fts}`)
          .order('brand_keyboard_slug')
          .limit(20),
        likeQuery: client
          .from('keyboards')
          .select('*, brand:keyboard_brands(name, slug, invertible_logo)')
          .or(
            `name.ilike.%${queryText}%,slug.ilike.%${queryText}%,brand_keyboard_slug.ilike.%${queryText}%`,
          )
          .order('brand_keyboard_slug')
          .limit(20),
      }),
    })

    searchTasks.push({
      key: 'keyboardReleases',
      search: runCombinedSearch({
        label: 'Keyboard Releases',
        ftsQuery: client
          .from('keyboard_releases')
          .select(
            '*, keyboard:keyboards(name, slug), brand:keyboard_brands(name, slug, invertible_logo)',
          )
          .textSearch('fts', `${fts}`)
          .order('brand_keyboard_slug')
          .limit(20),
        likeQuery: client
          .from('keyboard_releases')
          .select(
            '*, keyboard:keyboards(name, slug), brand:keyboard_brands(name, slug, invertible_logo)',
          )
          .or(`name.ilike.%${queryText}%,description.ilike.%${queryText}%`)
          .order('brand_keyboard_slug')
          .limit(20),
      }),
    })

    searchTasks.push({
      key: 'keyboardVariants',
      search: runCombinedSearch({
        label: 'Keyboard Variants',
        ftsQuery: client
          .from('keyboard_variants')
          .select(
            '*, keyboard:keyboards(name, slug), release:keyboard_releases(id, name, brand_keyboard_slug), brand:keyboard_brands(name, slug, invertible_logo)',
          )
          .textSearch('fts', `${fts}`)
          .order('release_id')
          .limit(20),
        likeQuery: client
          .from('keyboard_variants')
          .select(
            '*, keyboard:keyboards(name, slug), release:keyboard_releases(id, name, brand_keyboard_slug), brand:keyboard_brands(name, slug)',
          )
          .ilike('variant_name', `%${queryText}%`)
          .order('release_id')
          .limit(20),
      }),
    })
  }

  const resolvedSearches = await Promise.all(
    searchTasks.map(({ search }) => search),
  )

  const searchResults = searchTasks.reduce(
    (acc, task, index) => {
      acc[task.key] = resolvedSearches[index] || []
      return acc
    },
    {} as Record<string, any[]>,
  )

  const {
    artisanMakers = [],
    artisanSculpts = [],
    artisanColorways = [],
    keysets = [],
    keyboardBrands = [],
    keyboards = [],
    keyboardReleases = [],
    keyboardVariants = [],
  } = searchResults

  return [
    {
      id: 'artisan-maker',
      label: 'Artisan Makers',
      ignoreFilter: true,
      items: artisanMakers.map((m: any) => ({
        id: m.id,
        label: m.name,
        to: `/artisan/maker/${m.id}`,
        avatar: {
          src: `/logo/${m.id}.png`,
          alt: m.name,
          invertible: m.invertible_logo,
        },
      })),
    },
    {
      id: 'artisan-sculpt',
      label: 'Artisan Sculpts',
      ignoreFilter: true,
      items: artisanSculpts.map((s: any) => ({
        id: s.id,
        label: s.maker.name,
        suffix: s.name,
        to: `/artisan/maker/${s.maker_id}/${s.sculpt_id}`,
        avatar: {
          src: `/logo/${s.maker_id}.png`,
          alt: s.maker.name,
          invertible: s.maker.invertible_logo,
        },
      })),
    },
    {
      id: 'artisan-colorway',
      label: 'Artisan Colorways',
      ignoreFilter: true,
      items: groupByMakerWithChunks(artisanColorways).map((group, idx) => {
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
                invertible: maker.invertible_logo,
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
      id: 'keyset',
      label: 'Keysets',
      ignoreFilter: true,
      items: keysets.map((kc: any) => ({
        id: kc.id,
        label: `${kc.profile.name} ${kc.name}`,
        to: `/keyset/${kc.profile_keyset_id}`,
        avatar: {
          src: `/logo/${kc.profile.manufacturer_id}.png`,
          alt: kc.profile.name,
          invertible: true,
        },
      })),
    },
    {
      id: 'keyboard-brand',
      label: 'Keyboard Brands',
      ignoreFilter: true,
      items: keyboardBrands.map((brand: any) => ({
        id: brand.id,
        label: brand.name,
        to: `/keyboard/brand/${brand.slug}`,
        avatar: {
          src: `/logo/${brand.slug}.png`,
          alt: brand.name,
          invertible: brand.invertible_logo,
        },
      })),
    },
    {
      id: 'keyboard-board',
      label: 'Keyboards',
      ignoreFilter: true,
      items: keyboards.map((kb: any) => {
        return {
          id: kb.id,
          label: kb.brand.name,
          suffix: kb.name,
          to: `/keyboard/brand/${kb.brand_keyboard_slug}`,
          avatar: {
            src: `/logo/${kb.brand_slug}.png`,
            alt: kb.brand.name,
            invertible: kb.brand.invertible_logo,
          },
        }
      }),
    },
    {
      id: 'keyboard-release',
      label: 'Keyboard Releases',
      ignoreFilter: true,
      items: keyboardReleases.map((release: any) => {
        return {
          id: release.id,
          label: release.keyboard.name,
          suffix: release.name,
          to: `/keyboard/brand/${release.brand_keyboard_slug}`,
          avatar: {
            src: `/logo/${release.brand_slug}.png`,
            alt: release.brand.name,
            invertible: release.brand.invertible_logo,
          },
        }
      }),
    },
    {
      id: 'keyboard-variant',
      label: 'Keyboard Variants',
      ignoreFilter: true,
      items: keyboardVariants.map((variant: any) => {
        return {
          id: variant.id,
          label: `${variant.keyboard.name} ${variant.release.name}`,
          suffix: variant.variant_name,
          to: `/keyboard/brand/${variant.brand_keyboard_slug}`,
          avatar: {
            src: `/logo/${variant.brand_slug}.png`,
            alt: variant.brand.name,
            invertible: variant.brand.invertible_logo,
          },
        }
      }),
    },
  ].filter((c) => c.items?.length)
})
