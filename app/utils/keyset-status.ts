import { Constants, type Enums } from '~/types/database.types'

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

/**
 * Today as `YYYY-MM-DD` in UTC, to compare with the date-only group buy
 * columns. UTC on both sides, so the server renders what the client hydrates.
 */
export const isoToday = () => new Date().toISOString().slice(0, 10)

type KeysetDates = {
  status?: string | null
  start_date?: string | null
  end_date?: string | null
}

/**
 * Where a keyset stands: Live while a Confirmed set's group buy dates hold
 * today (the Live tab's rule), else its status.
 */
export const keysetPhase = (
  keyset: KeysetDates,
  today = isoToday(),
): KeysetPhase | null => {
  const status = (keyset.status as KeysetStatus | null) ?? null
  const live =
    status === 'Confirmed' &&
    !!keyset.start_date &&
    !!keyset.end_date &&
    keyset.start_date <= today &&
    keyset.end_date >= today

  return live ? 'Live' : status
}
