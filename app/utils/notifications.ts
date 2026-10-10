/**
 * Notification registry: maps each `notifications.type` to how it is shown
 * (title, description, note, icon, color, link). The `/notifications` page
 * and the realtime toast both render through
 * `renderNotification`, so a new type only needs an entry here plus a
 * database trigger calling `push_notification()`.
 */

export interface AppNotification {
  id: string
  type: string
  actor_id: string | null
  entity_type: string | null
  entity_id: string | null
  data: Record<string, any>
  read_at: string | null
  created_at: string
}

export type NotificationColor = 'success' | 'error' | 'warning' | 'info'

export interface NotificationView {
  title: string
  description: string
  // Free text written by a moderator (e.g. a reject note).
  note?: string | null
  icon: string
  color: NotificationColor
  to?: string
}

type NotificationRenderer = (notification: AppNotification) => NotificationView

const SUBMISSION_PATHS: Record<
  string,
  { detail: (parentKey: string) => string; queue: string }
> = {
  artisan: {
    detail: (key) => `/artisan/maker/${key}`,
    queue: '/artisan/submissions',
  },
  keyset: {
    detail: (key) => `/keyset/${key}`,
    queue: '/keyset/submissions',
  },
  keyboard: {
    detail: (key) => `/keyboard/brand/${key}`,
    queue: '/keyboard/submissions',
  },
}

const REGISTRY: Record<string, NotificationRenderer> = {
  // data: { status: 'approved' | 'rejected', note, submission_name, entity,
  // domain, parent_key }
  submission_status: ({ data }) => {
    const paths = SUBMISSION_PATHS[data.domain]
    const entity = data.entity || 'submission'
    const subject = data.submission_name
      ? `${entity} "${data.submission_name}"`
      : entity

    if (data.status === 'approved') {
      return {
        title: 'Submission Approved',
        description: `Your ${subject} has been approved and is now public.`,
        icon: 'hugeicons:checkmark-circle-02',
        color: 'success',
        to:
          paths && data.parent_key ? paths.detail(data.parent_key) : undefined,
      }
    }

    return {
      title: 'Submission Rejected',
      description: `Your ${subject} has been rejected. Edit it to send it back for review.`,
      note: data.note,
      icon: 'hugeicons:cancel-circle',
      color: 'error',
      to: paths?.queue,
    }
  },
}

const fallback: NotificationRenderer = () => ({
  title: 'Notification',
  description: 'You have a new notification.',
  icon: 'hugeicons:notification-01',
  color: 'info',
})

export const renderNotification = (
  notification: AppNotification,
): NotificationView => (REGISTRY[notification.type] || fallback)(notification)

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

/** `just now`, `5 minutes ago`, `yesterday`, `3 weeks ago`. */
export const formatTimeAgo = (date: string, now = Date.now()) => {
  const seconds = Math.round((new Date(date).getTime() - now) / 1000)

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeTime.format(Math.round(seconds / size), unit)
    }
  }

  return 'just now'
}

export type NotificationDateGroup =
  'Today' | 'Yesterday' | 'Earlier this week' | 'Older'

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** Date heading on `/notifications`; weeks start on Monday. */
export const notificationDateGroup = (
  date: string,
  now = new Date(),
): NotificationDateGroup => {
  const today = startOfDay(now)
  const day = startOfDay(new Date(date))
  const daysAgo = Math.round((today.getTime() - day.getTime()) / 86_400_000)

  if (daysAgo <= 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'

  const weekday = (today.getDay() + 6) % 7

  return daysAgo <= weekday ? 'Earlier this week' : 'Older'
}
