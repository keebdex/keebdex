import type { CalendarDate } from '@internationalized/date'
import { DateFormatter } from '@internationalized/date'

// Every date reads the same on every device, and the server renders what the
// client hydrates, so all formatters share one locale.
const LOCALE = 'en-US'

const dateFormatter = new DateFormatter(LOCALE, { dateStyle: 'medium' })
const dateTimeFormatter = new DateFormatter(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const relativeTime = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

type DateInput = string | Date

// ICU versions differ in the spaces they put around range dashes and before
// AM/PM (thin, narrow no-break, or plain), so Node and the browser would
// render different text and break hydration.
const plainSpaces = (text: string) => text.replace(/[\u2009\u202f]/g, ' ')

const asDate = (date: DateInput) =>
  date instanceof Date ? date : new Date(date)

export const toISODate = (date: CalendarDate) => date.toString()

/** `Oct 22, 2026`. */
export const formatDate = (date: DateInput | null | undefined) =>
  date ? plainSpaces(dateFormatter.format(asDate(date))) : ''

/** `Oct 22, 2026 at 4:36 PM`. */
export const formatDateTime = (date: DateInput | null | undefined) =>
  date ? plainSpaces(dateTimeFormatter.format(asDate(date))) : ''

/** `Oct 1 – 22, 2026`. */
export const formatDateRange = (
  fromDate: DateInput | null | undefined,
  toDate: DateInput | null | undefined,
) =>
  fromDate && toDate
    ? plainSpaces(dateFormatter.formatRange(asDate(fromDate), asDate(toDate)))
    : ''

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

/** `just now`, `5 minutes ago`, `yesterday`, `3 weeks ago`. */
export const formatTimeAgo = (date: DateInput, now = Date.now()) => {
  const seconds = Math.round((asDate(date).getTime() - now) / 1000)

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeTime.format(Math.round(seconds / size), unit)
    }
  }

  return 'just now'
}

/** Midnight of the date's day, in the local time zone. */
export const startOfDay = (date: DateInput) => {
  const value = asDate(date)

  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

/** Calendar days between the date and `now`: 0 today, 1 yesterday. */
export const daysAgo = (date: DateInput, now: DateInput = new Date()) =>
  Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000,
  )
