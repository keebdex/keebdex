import type { Database } from '~/types/database.types'

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

export const keysetStatusMap = {
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

export const colorwayTitle = (colorway: any) =>
  `${colorway.name} ${colorway?.sculpt.name}`

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

// UPageCard container for cards with an image above the title. The column is
// pinned to the card so a long footer cannot widen it (and the image with it)
export const imageCardContainerClass =
  'h-full grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)]'

export const SEARCH_TERM_MIN_LENGTH = 3

// Copies `keys` from `source` (missing keys become undefined), e.g. to hydrate
// a form model from an API record.
export const pickKeys = (source: Record<string, any>, keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, source?.[key]]))
