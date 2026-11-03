import { Constants, type Enums } from '~/types/database.types'
import { daysAgo, formatDate, formatDateRange, isoToday } from './date'

// Whether a keyset is going ahead, from the database's `keyset_status` enum:
// not decided yet (Interest Check), happening from its group buy to delivery
// (Confirmed, the column default), or cancelled. Whether its group buy is
// running comes from `start_date` and `end_date` (`keysetPhase`).
export type KeysetStatus = Enums<'keyset_status'>

export const KEYSET_STATUSES = Constants.public.Enums.keyset_status

export const DEFAULT_KEYSET_STATUS: KeysetStatus = 'Confirmed'

export type KeysetPhase = KeysetStatus | 'Live'

// Interest Check and Confirmed keep the badge's default color.
export const keysetPhaseColors: Partial<Record<KeysetPhase, string>> = {
  Live: 'primary',
  Cancelled: 'error',
}

type KeysetDates = {
  status?: KeysetStatus | null
  start_date?: string | null
  end_date?: string | null
}

/**
 * Where a keyset stands: Live while a Confirmed set's group buy dates hold
 * today (the rule `liveGroupBuys` applies to queries on the server), else its
 * status.
 */
export const keysetPhase = (
  keyset: KeysetDates,
  today = isoToday(),
): KeysetPhase | null => {
  const status = keyset.status ?? null
  const live =
    status === 'Confirmed' &&
    !!keyset.start_date &&
    !!keyset.end_date &&
    keyset.start_date <= today &&
    keyset.end_date >= today

  return live ? 'Live' : status
}

/**
 * A live group buy's countdown: "9 days left", counting the end date itself,
 * in warning colors for the last three days, and the share of its days that
 * have passed. Days are UTC dates, like `keysetPhase`.
 */
export const groupBuyCountdown = (
  keyset: { start_date: string; end_date: string },
  today = isoToday(),
) => {
  const days = daysAgo(today, keyset.end_date) + 1
  const length = daysAgo(keyset.start_date, keyset.end_date) + 1

  return {
    label: days <= 1 ? 'Last day' : `${days} days left`,
    color: days <= 3 ? ('warning' as const) : ('primary' as const),
    elapsed: Math.round(((length - days + 1) / length) * 100),
  }
}

/**
 * The date a keyset is known by: its group buy window when there is one,
 * else its interest check date, else nothing.
 */
export const keysetDateLabel = (keyset: {
  start_date?: string | null
  end_date?: string | null
  ic_date?: string | null
}) =>
  formatDateRange(keyset.start_date, keyset.end_date) ||
  (keyset.ic_date ? `IC ${formatDate(keyset.ic_date)}` : '')
