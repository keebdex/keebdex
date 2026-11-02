import type { Database } from '~/types/database.types'
import type { KeebModule } from '~/utils/keeb-modules'

export const formatPrice = (
  amount: number | null | undefined,
  currency: string | null = 'USD',
  { stripZeros = false } = {},
) => {
  if (!amount || isNaN(amount)) return ''

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
    // $169 rather than $169.00 where cents never apply
    ...(stripZeros && { trailingZeroDisplay: 'stripIfInteger' as const }),
  }).format(amount)
}

/**
 * Avatar props for a user's profile picture (from Google or Discord). Google
 * refuses most avatar requests that carry a referrer once a page shows
 * several, so the image loads without one.
 */
export const userAvatar = (
  src: string | null | undefined,
  alt?: string | null,
) => ({
  src: src || undefined,
  alt: alt || undefined,
  referrerpolicy: 'no-referrer' as const,
})

export const formatNumber = (value: number | null | undefined) =>
  value || value === 0 ? new Intl.NumberFormat('en-US').format(value) : ''

// A count the database estimates, as a round figure: "68,000+"
export const formatEstimate = (value: number) =>
  `${formatNumber(Math.floor(value / 1000) * 1000)}+`

// Profile rows hold a short name (CYL, SA) apart from the manufacturer (GMK,
// Signature Plastics); show both unless they say the same thing (JTK JTK)
export const keysetProfileLabel = (
  profile?: { name?: string | null; manufacturer?: string | null } | null,
) => {
  const name = profile?.name || ''
  const manufacturer = profile?.manufacturer || ''

  if (!manufacturer || manufacturer.toLowerCase() === name.toLowerCase()) {
    return name || manufacturer
  }

  return name ? `${manufacturer} ${name}` : manufacturer
}

/**
 * Select items for profiles grouped by keycap profile (`groupedProfiles` from
 * `GET /api/keysets/profiles`): a label per group, then its profiles.
 */
export const groupedProfileItems = (
  groupedProfiles: Record<string, Record<string, string>> = {},
) =>
  Object.entries(groupedProfiles)
    .flatMap(([label, profiles]) => [
      { type: 'separator' as const },
      { type: 'label' as const, label },
      ...Object.entries(profiles).map(([value, name]) => ({
        type: 'item' as const,
        label: name,
        value,
      })),
    ])
    .slice(1)

// Tabs of the Group Buys page (`/keyset/group-buy?status=`), keyed by the
// `status` query value `GET /api/keysets` reads.
export const groupBuyTabs = {
  ic: {
    title: 'Interest Check',
    label: 'Interest Check',
    description:
      'Sets currently in the interest check stage where designers gather community feedback.',
    icon: 'hugeicons:idea-01',
  },
  live: {
    title: 'Group Buy Live',
    label: 'Live',
    description:
      'Sets whose group buy is running today, going by its start and end dates.',
    icon: 'hugeicons:live-streaming-02',
  },
}

export const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
]

export const statusColorMap: Record<string, string> = {
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'error',
}

// The colorway's name and its sculpt's, or the name alone without a sculpt
export const colorwayTitle = (colorway: any) =>
  [colorway.name, colorway.sculpt?.name].filter(Boolean).join(' ')

export const formatKeyboardDescription = (names: Array<string | undefined>) => {
  return names.filter((n) => !!n).join(' ')
}

export const getSortIconMap = (
  options: Array<{ value: string; icon: string }>,
) => {
  return options.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.icon
    return acc
  }, {})
}

export const discordInviteRegex = /discord\.gg\/[a-zA-Z0-9]+/
export const instagramProfileRegex =
  /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._-]+/

export const roleMap: Record<
  Database['public']['Enums']['user_role'],
  { label: string; icon: string; class: string; color: string }
> = {
  admin: {
    label: 'Administrator',
    icon: 'hugeicons:user-shield-01',
    class: 'text-error',
    color: 'error',
  },
  editor: {
    label: 'Editor',
    icon: 'hugeicons:user-edit-01',
    class: 'text-warning',
    color: 'warning',
  },
  maker: {
    label: 'Maker',
    icon: 'hugeicons:user-star-01',
    class: 'text-info',
    color: 'info',
  },
  designer: {
    label: 'Designer',
    icon: 'hugeicons:user-star-01',
    class: 'text-info',
    color: 'info',
  },
  donator: {
    label: 'Donator',
    icon: 'hugeicons:user-love-01',
    class: 'text-donator',
    color: 'success',
  },
}

export const getRoleLabel = (
  role: Database['public']['Enums']['user_role'],
) => {
  const mapping = roleMap[role]
  return mapping ? mapping.label : role.charAt(0).toUpperCase() + role.slice(1)
}

// Artisan grids (colorways, sculpts, makers); colorway images use the
// `square` image preset sized for these columns
export const artisanGridClass =
  'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 4xl:grid-cols-9 gap-4'

// Grids of wide logo cards (keyboard brands, keyset profiles)
export const logoGridClass =
  'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 4xl:grid-cols-7 gap-4'

// UPageCard container for cards with an image above the title. The column is
// pinned to the card so a long footer cannot widen it (and the image with it)
export const imageCardContainerClass =
  'h-full grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)]'

// A small mono uppercase eyebrow over a title (the home page's sections, the
// wishlist settings' groups); callers add its color
export const eyebrowClass =
  'font-mono text-xs font-medium uppercase tracking-[0.2em]'

// A UPageHeader scaled down to head a section of a detail page (a keyboard's
// releases, a keyset's kits and colors): an h2 title, no border or padding,
// and the actions beside the title at every width. Pass both to the header
// (`:as="detailSectionHeaderAs" :ui="detailSectionHeaderUi"`).
export const detailSectionHeaderAs = { title: 'h2' }
export const detailSectionHeaderUi = {
  root: 'border-none py-0',
  wrapper: 'flex-row items-start justify-between',
  title: 'text-lg sm:text-lg font-semibold',
  description: 'mt-1 text-sm text-start',
  links: 'shrink-0',
}

// The UPageHeader at the top of a detail page, inside `SharedDetailHero`: no
// border or padding, and the actions beside the title, except under it from
// lg to xl when media sits beside it, where the column is too narrow for both.
export const detailPageHeaderUi = (withMedia: boolean) => ({
  root: 'border-none py-0',
  wrapper: [
    // UPageHeader centers its wrapper from lg; keep the title at the start
    'gap-3 sm:flex-row sm:items-start sm:justify-between lg:items-start',
    withMedia && 'lg:flex-col 2xl:flex-row',
  ],
  links: 'flex flex-wrap gap-2 shrink-0',
  headline: 'mb-1',
  description: 'text-sm',
})

// The UPageHeader opening a catalog list (makers, brands, profiles, group
// buys, collections): the module as a mono eyebrow in the primary color, a
// large title and a sentence, and the page's actions on the right, like the
// home page's section headers
export const listingPageHeaderUi = {
  root: 'border-none py-0',
  wrapper: 'gap-4 sm:flex-row sm:items-end sm:justify-between lg:items-end',
  headline: ['mb-2 text-primary', eyebrowClass],
  title: 'text-2xl sm:text-3xl',
  description: 'mt-2 text-muted text-pretty',
  links: 'flex flex-wrap gap-2 shrink-0',
}

// Rows whose `key` contains every word of `query`, ignoring case and accents;
// a list's filter box (makers, brands, profiles, sculpts)
const folded = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export const filterByName = <T extends Record<string, any>>(
  items: T[],
  query: string,
  key: keyof T = 'name',
) => {
  const words = folded(query).split(/\s+/).filter(Boolean)

  if (!words.length) return items

  return items.filter((item) => {
    const name = folded(String(item[key] ?? ''))
    return words.every((word) => name.includes(word))
  })
}

// A country's English name from its ISO code (`country_origin`, as the maker
// and brand forms store it, e.g. `vn`); codes ICU does not know (flag-icons'
// `gb-eng`) show as they are
const regionNames = new Intl.DisplayNames(['en-US'], { type: 'region' })

export const countryName = (code?: string | null) => {
  if (!code) return ''

  try {
    return regionNames.of(code.toUpperCase()) || code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

// Where an Add button leads: staff (`editable`) open the form in place, and
// everyone else goes to the module's submission wizard with `query`
// preselected. Bind the result to the button (`v-bind`).
export const submissionTarget = (
  editable: boolean,
  onClick: () => void,
  module: KeebModule,
  query: Record<string, unknown>,
) =>
  editable
    ? { onClick }
    : { to: { path: `/${module}/submissions/submit`, query } }

export const SEARCH_TERM_MIN_LENGTH = 3

// Copies `keys` from `source` (missing keys become undefined), e.g. to hydrate
// a form model from an API record.
export const pickKeys = (source: Record<string, any>, keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, source?.[key]]))

// Whether a form or record value is unset: null, undefined, an empty string,
// or an empty list. Unlike lodash's isEmpty, numbers (a price, a year) and
// booleans count as set.
export const isBlank = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && !value.length)
