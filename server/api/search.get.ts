import { serverSupabaseClient } from '#supabase/server'
import { PUBLISHED_FILTER } from '../utils'
import { logoUrl } from '~/utils/logo'

const {
  public: { imgUrl },
} = useRuntimeConfig()

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
  if (result.error) throw dbError(result.error, `search ${label}`)
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

// colorways shown in the palette; the rest are on the results page
const PALETTE_COLORWAY_LIMIT = 24

// Only the columns the palette items below are built from: the search runs
// as the user types, and full rows (with their search vectors) made parsing
// the responses most of its CPU time
const SELECT = {
  makers: 'id, maker_id, name, invertible_logo',
  sculpts:
    'id, name, maker_id, sculpt_id, maker:artisan_makers(name, invertible_logo)',
  keysets:
    'id, name, profile_keyset_id, profile:keyset_profiles(name, manufacturer_id)',
  brands: 'id, name, slug, invertible_logo',
  keyboards:
    'id, name, brand_keyboard_slug, brand_slug, brand:keyboard_brands(name, slug, invertible_logo)',
  // Status-less releases follow their keyboard, so the keyboard must be
  // published too (inner join, filtered below)
  releases:
    'id, name, brand_keyboard_slug, brand_slug, keyboard:keyboards!inner(name, slug), brand:keyboard_brands(name, slug, invertible_logo)',
  variants:
    'id, variant_name, brand_keyboard_slug, brand_slug, keyboard:keyboards(name, slug), release:keyboard_releases(id, name, brand_keyboard_slug), brand:keyboard_brands(name, slug, invertible_logo)',
} as const

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { term, query, module } = getQuery(event)
  // Trimmed and cut to the longest accepted term
  const queryText = cleanSearchTerm(term || query)

  if (!queryText) return []

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

  // A `websearch` query matching any word; never fails on odd input
  const fts = websearchAny(queryText)

  // The term as a literal `ilike` pattern, for `.or()` and for `.ilike()`
  const orPattern = ilikeOrValue(queryText)
  const likePattern = ilikeContains(queryText)

  const searchTasks: Array<{ key: string; search: Promise<any[]> }> = []
  let colorwaySearch: ReturnType<typeof searchPaletteColorways> | undefined

  if (isIncluded('artisan')) {
    searchTasks.push({
      key: 'artisanMakers',
      search: runCombinedSearch({
        label: 'Artisan Makers',
        ftsQuery: client
          .from('artisan_makers')
          .select(SELECT.makers)
          .or(PUBLISHED_FILTER)
          .textSearch('fts', fts, { type: 'websearch' })
          .order('maker_id')
          .limit(10),
        likeQuery: client
          .from('artisan_makers')
          .select(SELECT.makers)
          .or(PUBLISHED_FILTER)
          .or(`name.ilike.${orPattern},maker_id.ilike.${orPattern}`)
          .order('maker_id')
          .limit(10),
      }),
    })

    searchTasks.push({
      key: 'artisanSculpts',
      search: runCombinedSearch({
        label: 'Artisan Sculpts',
        ftsQuery: client
          .from('artisan_sculpts')
          .select(SELECT.sculpts)
          .textSearch('fts', fts, { type: 'websearch' })
          .order('maker_sculpt_id')
          .limit(20),
        likeQuery: client
          .from('artisan_sculpts')
          .select(SELECT.sculpts)
          .or(
            `name.ilike.${orPattern},maker_id.ilike.${orPattern},sculpt_id.ilike.${orPattern}`,
          )
          .order('maker_sculpt_id')
          .limit(20),
      }),
    })

    colorwaySearch = searchPaletteColorways(
      client,
      queryText,
      PALETTE_COLORWAY_LIMIT,
    )
  }

  if (isIncluded('keyset')) {
    searchTasks.push({
      key: 'keysets',
      search: runCombinedSearch({
        label: 'Keysets',
        ftsQuery: client
          .from('keysets')
          .select(SELECT.keysets)
          .or(PUBLISHED_FILTER)
          .textSearch('fts', fts, { type: 'websearch' })
          .order('profile_keyset_id')
          .limit(10),
        likeQuery: client
          .from('keysets')
          .select(SELECT.keysets)
          .or(PUBLISHED_FILTER)
          .or(
            `name.ilike.${orPattern},profile_keyset_id.ilike.${orPattern},designer.ilike.${orPattern}`,
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
          .select(SELECT.brands)
          .or(PUBLISHED_FILTER)
          .textSearch('fts', fts, { type: 'websearch' })
          .order('slug')
          .limit(10),
        likeQuery: client
          .from('keyboard_brands')
          .select(SELECT.brands)
          .or(PUBLISHED_FILTER)
          .or(`name.ilike.${orPattern},slug.ilike.${orPattern}`)
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
          .select(SELECT.keyboards)
          .or(PUBLISHED_FILTER)
          .textSearch('fts', fts, { type: 'websearch' })
          .order('brand_keyboard_slug')
          .limit(20),
        likeQuery: client
          .from('keyboards')
          .select(SELECT.keyboards)
          .or(PUBLISHED_FILTER)
          .or(
            `name.ilike.${orPattern},slug.ilike.${orPattern},brand_keyboard_slug.ilike.${orPattern}`,
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
          .select(SELECT.releases)
          .or(PUBLISHED_FILTER)
          .or(PUBLISHED_FILTER, { referencedTable: 'keyboard' })
          .textSearch('fts', fts, { type: 'websearch' })
          .order('brand_keyboard_slug')
          .limit(20),
        likeQuery: client
          .from('keyboard_releases')
          .select(SELECT.releases)
          .or(PUBLISHED_FILTER)
          .or(PUBLISHED_FILTER, { referencedTable: 'keyboard' })
          .or(`name.ilike.${orPattern},description.ilike.${orPattern}`)
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
          .select(SELECT.variants)
          .or(PUBLISHED_FILTER)
          .textSearch('fts', fts, { type: 'websearch' })
          .order('release_id')
          .limit(20),
        likeQuery: client
          .from('keyboard_variants')
          .select(SELECT.variants)
          .or(PUBLISHED_FILTER)
          .ilike('variant_name', likePattern)
          .order('release_id')
          .limit(20),
      }),
    })
  }

  const [resolvedSearches, colorways] = await Promise.all([
    Promise.all(searchTasks.map(({ search }) => search)),
    colorwaySearch,
  ])

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
        id: m.maker_id,
        label: m.name,
        to: `/artisan/maker/${m.maker_id}`,
        avatar: {
          src: logoUrl(m.maker_id, imgUrl),
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
          src: logoUrl(s.maker_id, imgUrl),
          alt: s.maker.name,
          invertible: s.maker.invertible_logo,
        },
      })),
    },
    {
      id: 'artisan-colorway',
      label: 'Artisan Colorways',
      ignoreFilter: true,
      // lets the palette link to the full results page
      total: colorways?.total ?? 0,
      viewAllTo: '/artisan/search',
      items: (colorways?.items || []).map((c: any) => ({
        id: c.id,
        label: c.name,
        suffix: `${c.maker.name} ${c.sculpt.name}`,
        to: `/artisan/maker/${c.maker_id}/${c.sculpt_id}?cid=${c.colorway_id}`,
        avatar: {
          src: logoUrl(c.maker_id, imgUrl),
          alt: c.maker.name,
          invertible: c.maker.invertible_logo,
        },
      })),
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
          src: logoUrl(kc.profile.manufacturer_id, imgUrl),
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
          src: logoUrl(brand.slug, imgUrl),
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
            src: logoUrl(kb.brand_slug, imgUrl),
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
            src: logoUrl(release.brand_slug, imgUrl),
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
            src: logoUrl(variant.brand_slug, imgUrl),
            alt: variant.brand.name,
            invertible: variant.brand.invertible_logo,
          },
        }
      }),
    },
  ].filter((c) => c.items?.length)
})
