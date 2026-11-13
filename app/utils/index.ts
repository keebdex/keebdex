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

// A keyset profile's logo key: its manufacturer's (logo files are keyed by
// manufacturer, GMK's for CYL and MTNU), else the profile's own
export const keysetProfileLogoKey = (
  profile?: { manufacturer_id?: string | null; profile_id?: string } | null,
) => profile?.manufacturer_id || profile?.profile_id || ''

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
    icon: 'solar:lightbulb-line-duotone',
    emptyIcon: 'solar:lightbulb-bold-duotone',
  },
  live: {
    title: 'Group Buy Live',
    label: 'Live',
    description:
      'Sets whose group buy is running today, going by its start and end dates.',
    icon: 'solar:play-stream-line-duotone',
    emptyIcon: 'solar:play-stream-bold-duotone',
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
    icon: 'solar:shield-user-line-duotone',
    class: 'text-error',
    color: 'error',
  },
  editor: {
    label: 'Editor',
    icon: 'solar:user-speak-line-duotone',
    class: 'text-warning',
    color: 'warning',
  },
  maker: {
    label: 'Maker',
    icon: 'solar:user-rounded-line-duotone',
    class: 'text-info',
    color: 'info',
  },
  designer: {
    label: 'Designer',
    icon: 'solar:user-rounded-line-duotone',
    class: 'text-info',
    color: 'info',
  },
}

// The Supporter badge (users.supporter): users who donated, whatever their role
export const SUPPORTER_BADGE = {
  label: 'Supporter',
  icon: 'solar:user-heart-line-duotone',
  // The heart on a supporter's avatar, too small for a duotone icon
  filledIcon: 'solar:heart-bold',
  class: 'text-donator',
  color: 'success',
} as const

// A user's role and Supporter badge as one line, e.g. "Editor · Supporter"
export const userRoleLabel = (
  role: string | null | undefined,
  supporter?: boolean | null,
) =>
  [
    role && roleMap[role as keyof typeof roleMap]?.label,
    supporter && SUPPORTER_BADGE.label,
  ]
    .filter(Boolean)
    .join(' · ') || undefined

export const getRoleLabel = (
  role: Database['public']['Enums']['user_role'],
) => {
  const mapping = roleMap[role]
  return mapping ? mapping.label : role.charAt(0).toUpperCase() + role.slice(1)
}

// Grids of square cards: artisan colorways and sculpts, and the maker, brand,
// and profile lists; colorway images use the `square` image preset sized for
// these columns. Six is the most: panel content stops at 96rem
export const artisanGridClass =
  'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4'

// Grids of color swatches (`KeysetColorTile`): the Colors page, and the
// denser one of a keyset's palette, with compact tiles
export const colorSwatchGridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6'
export const colorPaletteGridClass =
  'grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8'

// The pin on the Pinned label over a list's pinned makers or sculpts
export const PINNED_ICON = 'solar:pin-bold'

// A list's pinned items and the rest, each in its own order: `groups` for the
// list (Pinned, then Others, empty ones dropped) and `all`, pinned first, for
// its Customize Pins modal
export const splitPinned = <T>(items: T[], isPinned: (item: T) => boolean) => {
  const pinned: T[] = []
  const others: T[] = []

  for (const item of items) (isPinned(item) ? pinned : others).push(item)

  return {
    pinned,
    all: [...pinned, ...others],
    groups: [
      { label: 'Pinned', pinned: true, items: pinned },
      { label: 'Others', pinned: false, items: others },
    ].filter((group) => group.items.length),
  }
}

// A maker's or brand's own links (website and socials), opened in a new tab
const OWNER_LINKS = [
  { key: 'website', label: 'Website', icon: 'solar:earth-line-duotone' },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'simple-icons:instagram',
  },
  { key: 'discord', label: 'Discord', icon: 'simple-icons:discord' },
] as const

export const ownerLinks = (
  owner?: Partial<Record<(typeof OWNER_LINKS)[number]['key'], string | null>>,
) =>
  OWNER_LINKS.filter(({ key }) => owner?.[key]).map(({ key, label, icon }) => ({
    label,
    icon,
    to: owner![key]!,
    target: '_blank',
  }))

// Drops UContainer's width and side gutters from a UPageHero or UPageSection
// inside a dashboard panel, whose body already sets both; add the section's
// own padding and gap after it
export const panelContainerClass = 'max-w-none px-0 sm:px-0 lg:px-0'

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
})

// The UPageHeader opening a catalog list (makers, brands, profiles, group
// buys, collections): a large title and a sentence, and the page's actions on
// the right. The module is named by the navbar, so there is no headline
export const listingPageHeaderUi = {
  root: 'border-none py-0',
  wrapper: 'gap-4 sm:flex-row sm:items-end sm:justify-between lg:items-end',
  title: 'text-2xl sm:text-3xl',
  description: 'mt-2 text-muted text-pretty',
  links: 'flex flex-wrap gap-2 shrink-0',
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
