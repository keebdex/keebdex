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
  // The user's own text the notification is about (e.g. their feedback).
  quote?: string | null
  // Free text written by staff (e.g. a reject note, a resolution comment).
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

// "kit "GMK Olivia - Base"" for one submission; "3 kits in "GMK Olivia""
// once grouped notifications have merged several (data.count).
const submissionSubject = (data: Record<string, any>) => {
  const entity = data.entity || 'submission'
  const count = Number(data.count) || 1

  if (count > 1) {
    const plural = `${count} ${entity}s`

    return data.parent_name ? `${plural} in "${data.parent_name}"` : plural
  }

  return data.submission_name ? `${entity} "${data.submission_name}"` : entity
}

const isPlural = (data: Record<string, any>) => (Number(data.count) || 1) > 1

const ROLE_LABELS: Record<string, string> = {
  admin: 'an Administrator',
  editor: 'an Editor',
  maker: 'a Maker',
  designer: 'a Designer',
  donator: 'a Donator',
}

const REGISTRY: Record<string, NotificationRenderer> = {
  // data: { status: 'approved' | 'rejected', note, submission_name,
  // parent_name, entity, domain, parent_key, count }
  submission_status: ({ data }) => {
    const paths = SUBMISSION_PATHS[data.domain]
    const subject = submissionSubject(data)
    const verb = isPlural(data) ? 'have' : 'has'

    if (data.status === 'approved') {
      return {
        title: 'Submission Approved',
        description: `Your ${subject} ${verb} been approved and ${isPlural(data) ? 'are' : 'is'} now public.`,
        icon: 'hugeicons:checkmark-circle-02',
        color: 'success',
        to:
          paths && data.parent_key ? paths.detail(data.parent_key) : undefined,
      }
    }

    return {
      title: 'Submission Rejected',
      description: `Your ${subject} ${verb} been rejected. Edit to send ${isPlural(data) ? 'them' : 'it'} back for review.`,
      note: data.note,
      icon: 'hugeicons:cancel-circle',
      color: 'error',
      to: paths?.queue,
    }
  },
  // Sent to the moderator who rejected the submission.
  // data: { submission_name, parent_name, entity, domain, parent_key, count }
  submission_resubmitted: ({ data }) => {
    // "A kit "GMK Olivia - Base" you rejected is" / "3 kits in "GMK Olivia"
    // you rejected are"
    const lead = isPlural(data)
      ? `${submissionSubject(data)} you rejected are`
      : `A ${submissionSubject(data)} you rejected is`

    return {
      title: 'Submission Resubmitted',
      description: `${lead} back for review.`,
      icon: 'hugeicons:file-verified',
      color: 'info',
      to: SUBMISSION_PATHS[data.domain]?.queue,
    }
  },
  // data: { note (reason), submission_name, parent_name, entity, domain,
  // parent_key, count }
  submission_deleted: ({ data }) => ({
    title: 'Submission Deleted',
    description: `Your ${submissionSubject(data)} ${isPlural(data) ? 'have' : 'has'} been deleted by a moderator.`,
    note: data.note,
    icon: 'hugeicons:delete-02',
    color: 'warning',
    to: SUBMISSION_PATHS[data.domain]?.queue,
  }),
  // data: { role, previous_role, assignments_added, assignments_removed }
  account_role_changed: ({ data }) => {
    const added = data.assignments_added?.length || 0
    const removed = data.assignments_removed?.length || 0
    const pages = (count: number) => `${count} page${count === 1 ? '' : 's'}`
    const changes = [
      added && `added ${pages(added)}`,
      removed && `removed ${pages(removed)}`,
    ].filter(Boolean)

    let description: string

    if (data.role !== data.previous_role) {
      description = data.role
        ? `You are now ${ROLE_LABELS[data.role] || data.role} on Keebdex.`
        : 'Your staff access on Keebdex has been removed.'
    } else {
      description = `Your assignments changed: ${changes.join(' and ')}.`
    }

    return {
      title: 'Account Access Updated',
      description,
      icon: 'hugeicons:user-shield-01',
      color: 'info',
    }
  },
  // data: { message (excerpt of the feedback), note }
  feedback_resolved: ({ data }) => ({
    title: 'Feedback Resolved',
    description: data.note
      ? 'We resolved your feedback and left you a comment. Thanks for helping improve Keebdex!'
      : 'We resolved your feedback. Thanks for helping improve Keebdex!',
    quote: data.message,
    note: data.note,
    icon: 'hugeicons:message-done-02',
    color: 'success',
  }),
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
