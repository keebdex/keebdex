import type { CalendarDate } from '@internationalized/date'
import { DateFormatter } from '@internationalized/date'

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

export const keysetProfiles = {
  Cherry: {
    epbt: 'ePBT',
    gmk: 'GMK CYL',
    jtk: 'JTK',
    keykobo: 'Key Kobo',
    mw: 'MW',
    pbtfans: 'PBTfans',
  },
  SA: {
    sa: 'Signature Plastics',
  },
  Others: {
    dcs: 'DCS',
    dsa: 'DSA',
    'gmk-mtnu': 'GMK MTNU',
    kat: 'KAT',
    kam: 'KAM',
    mt3: 'MT3',
    xda: 'XDA',
  },
}

export const keysetStatusColors = {
  'Interest Check': 'secondary',
  Cancelled: 'error',
  Scheduled: 'info',
  Live: 'primary',
  'In Production': 'warning',
  Shipping: 'info',
  Complete: 'success',
}

export const keysetStatusMap = {
  ic: {
    title: 'Interest Check',
    description:
      'Sets currently in the interest check stage where designers gather community feedback.',
    icon: 'hugeicons:idea-01',
  },
  live: {
    title: 'Group Buy Live',
    description:
      'Sets that are either live in group buy or scheduled to start soon.',
    icon: 'hugeicons:live-streaming-02',
  },
  ended: {
    title: 'Group Buy Ended',
    description:
      'Sets with group buys already ended and awaiting production or delivery.',
    icon: 'hugeicons:archive-02',
  },
  pending: {
    title: 'Pending Review',
    description:
      'Awaiting admin or moderator review before being visible to users.',
    icon: 'hugeicons:edit-01',
  },
}

export const manufacturers = Object.values(keysetProfiles).reduce(
  (curr, prev) => {
    Object.assign(curr, prev)
    return curr
  },
  {},
)

export const colorwayTitle = (colorway: any) =>
  `${colorway.name} ${colorway?.sculpt.name}`

export const formatKeyboardDescription = (names: Array<string | undefined>) => {
  return names.filter((n) => !!n).join(' ')
}

export const discordInviteRegex = /discord\.gg\/[a-zA-Z0-9]+/
export const instagramProfileRegex =
  /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._-]+/

export const roleMap: Record<
  string,
  { label: string; icon: string; class: string; color: string }
> = {
  admin: {
    label: 'Administrator',
    icon: 'hugeicons:shield-user',
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

export const getRoleLabel = (role: string) => {
  const mapping = roleMap[role]
  return mapping ? mapping.label : role.charAt(0).toUpperCase() + role.slice(1)
}
