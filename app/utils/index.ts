import type { CalendarDate } from '@internationalized/date'
import { DateFormatter } from '@internationalized/date'
import type { Database } from '~/types/database.types'

const df = new DateFormatter('en-US', {
  dateStyle: 'medium',
})

export const toISODate = (date: CalendarDate) => {
  return date.toString()
}

export const formatDate = (date: string) => {
  return date ? df.format(new Date(date)) : ''
}

export const formatDateRange = (fromDate: string, toDate: string) => {
  return fromDate && toDate
    ? df.formatRange(new Date(fromDate), new Date(toDate))
    : ''
}

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

export const formatNumber = (value: number | null | undefined) =>
  value || value === 0 ? new Intl.NumberFormat('en-US').format(value) : ''

export const keysetStatusColors: Record<
  Database['public']['Enums']['keyset_status'],
  string
> = {
  'Interest Check': 'secondary',
  Cancelled: 'error',
  Scheduled: 'info',
  Live: 'primary',
  'In Production': 'warning',
  Shipping: 'info',
  Complete: 'success',
}

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
      'Sets that are either live in group buy or scheduled to start soon.',
    icon: 'hugeicons:live-streaming-02',
  },
  ended: {
    title: 'Group Buy Ended',
    label: 'Ended',
    description:
      'Sets with group buys already ended and awaiting production or delivery.',
    icon: 'hugeicons:file-archive',
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

export const squareGridClass =
  'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 4xl:grid-cols-9 gap-4'

export const SEARCH_TERM_MIN_LENGTH = 3

// Copies `keys` from `source` (missing keys become undefined), e.g. to hydrate
// a form model from an API record.
export const pickKeys = (source: Record<string, any>, keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, source?.[key]]))
