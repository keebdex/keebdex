/**
 * Notification registry: maps each `notifications.type` to how it is shown
 * (title, description, note, icon, color, link). Icons use Solar's
 * `bold-duotone` style. The `/notifications` page
 * and the realtime toast both render through
 * `renderNotification`, so a new type only needs an entry here plus a
 * database trigger calling `push_notification()`.
 */

import { SUPPORTER_BADGE } from './index'

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
  // A color for the icon other than `color`'s (a full Tailwind class), e.g.
  // the Supporter color on the Supporter thank-you
  iconClass?: string
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

const ACCOUNT_ICON = 'solar:shield-user-bold-duotone'

// What each role lets its holder do, for the notification that grants it;
// the icons are roleMap's in bold-duotone, named in full for the icon bundle
const ROLE_NOTICES: Record<
  string,
  { article: string; description: string; icon: string }
> = {
  admin: {
    article: 'an Administrator',
    icon: 'solar:shield-user-bold-duotone',
    description: 'You can now manage everything on Keebdex, including users.',
  },
  editor: {
    article: 'an Editor',
    icon: 'solar:user-speak-bold-duotone',
    description: 'You can now review submissions and edit pages on Keebdex.',
  },
  maker: {
    article: 'a Maker',
    icon: 'solar:user-rounded-bold-duotone',
    description:
      'You can now manage the makers assigned to you, with their sculpts and colorways.',
  },
  designer: {
    article: 'a Designer',
    icon: 'solar:user-rounded-bold-duotone',
    description:
      'You can now manage the keysets assigned to you, with their kits and colors.',
  },
}

// The Supporter badge is a thank-you, not access, so it reads as one
const supporterView = (supporter: boolean): NotificationView =>
  supporter
    ? {
        title: 'Thank You for Your Support',
        description:
          'Your donation helps keep Keebdex running. Your profile now shows the Supporter badge.',
        icon: 'solar:hearts-bold-duotone',
        color: 'success',
        iconClass: SUPPORTER_BADGE.class,
      }
    : {
        title: 'Supporter Badge Removed',
        description: 'Your profile no longer shows the Supporter badge.',
        icon: 'solar:heart-off-bold-duotone',
        color: 'info',
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
        icon: 'solar:check-circle-bold-duotone',
        color: 'success',
        to:
          paths && data.parent_key ? paths.detail(data.parent_key) : undefined,
      }
    }

    return {
      title: 'Submission Rejected',
      description: `Your ${subject} ${verb} been rejected. Edit to send ${isPlural(data) ? 'them' : 'it'} back for review.`,
      note: data.note,
      icon: 'solar:close-circle-bold-duotone',
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
      icon: 'solar:file-check-bold-duotone',
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
    icon: 'solar:trash-bin-minimalistic-bold-duotone',
    color: 'warning',
    to: SUBMISSION_PATHS[data.domain]?.queue,
  }),
  // data: { status: 'approved' | 'rejected', note, entity_name, entity_type,
  // domain, parent_key, fields, count }
  suggestion_status: ({ data }) => {
    const paths = SUBMISSION_PATHS[data.domain]
    const count = Number(data.count) || 1
    const subject =
      count > 1
        ? `${count} suggested edits`
        : data.entity_name
          ? `suggested edit to "${data.entity_name}"`
          : 'suggested edit'
    const verb = count > 1 ? 'have' : 'has'

    if (data.status === 'approved') {
      return {
        title: 'Edit Approved',
        description: `Your ${subject} ${verb} been approved and ${count > 1 ? 'are' : 'is'} now live. Thanks for helping keep Keebdex accurate!`,
        icon: 'solar:check-circle-bold-duotone',
        color: 'success',
        to:
          paths && data.parent_key ? paths.detail(data.parent_key) : undefined,
      }
    }

    return {
      title: 'Edit Rejected',
      description: `Your ${subject} ${verb} been rejected.`,
      note: data.note,
      icon: 'solar:close-circle-bold-duotone',
      color: 'error',
      to: paths ? `${paths.queue}?view=edits` : undefined,
    }
  },
  // data: { role, previous_role, assignments_added, assignments_removed }
  // Rows sent on 2026-11-13 may also carry the Supporter badge as `supporter`
  // and `previous_supporter`, and older ones as the `donator` role: a row that
  // changed only the badge renders as account_supporter_changed
  account_role_changed: (notification) => {
    const { data } = notification
    const legacy = (value: string | null) =>
      value === 'donator' ? null : value
    const role = legacy(data.role)
    const previousRole = legacy(data.previous_role)
    const added = data.assignments_added?.length || 0
    const removed = data.assignments_removed?.length || 0
    const supporter = data.supporter ?? data.role === 'donator'
    const previousSupporter =
      data.previous_supporter ?? data.previous_role === 'donator'

    if (role === previousRole && !added && !removed) {
      return supporter !== previousSupporter
        ? supporterView(supporter)
        : fallback(notification)
    }

    const pages = (count: number) => `${count} page${count === 1 ? '' : 's'}`
    const changes = [
      added && `added ${pages(added)}`,
      removed && `removed ${pages(removed)}`,
    ].filter(Boolean)

    if (role === previousRole) {
      return {
        title: 'Assignments Updated',
        description: `Your assignments changed: ${changes.join(' and ')}.`,
        icon: 'solar:clipboard-list-bold-duotone',
        color: 'info',
      }
    }

    if (!role) {
      return {
        title: 'Staff Access Removed',
        description: `You are no longer ${ROLE_NOTICES[previousRole!]?.article || 'staff'} on Keebdex.`,
        icon: 'solar:shield-minus-bold-duotone',
        color: 'warning',
      }
    }

    const notice = ROLE_NOTICES[role]
    // A first role lists the pages it starts with; a role switch, what changed
    const assignments = previousRole
      ? changes.length && `Your assignments changed: ${changes.join(' and ')}.`
      : added && `You start with ${pages(added)} assigned to you.`

    return {
      title: `You Are Now ${notice?.article || role}`,
      description: [notice?.description, assignments].filter(Boolean).join(' '),
      icon: notice?.icon || ACCOUNT_ICON,
      color: previousRole ? 'info' : 'success',
    }
  },
  // data: { supporter }
  account_supporter_changed: ({ data }) => supporterView(!!data.supporter),
  // data: { message (excerpt of the feedback), note }
  feedback_resolved: ({ data }) => ({
    title: 'Feedback Resolved',
    description: data.note
      ? 'We resolved your feedback and left you a comment. Thanks for helping improve Keebdex!'
      : 'We resolved your feedback. Thanks for helping improve Keebdex!',
    quote: data.message,
    note: data.note,
    icon: 'solar:chat-round-check-bold-duotone',
    color: 'success',
  }),
}

const fallback: NotificationRenderer = () => ({
  title: 'Notification',
  description: 'You have a new notification.',
  icon: 'solar:notification-unread-lines-bold-duotone',
  color: 'info',
})

export const renderNotification = (
  notification: AppNotification,
): NotificationView => (REGISTRY[notification.type] || fallback)(notification)

export type NotificationDateGroup =
  'Today' | 'Yesterday' | 'Earlier this week' | 'Older'

/** Date heading on `/notifications`; weeks start on Monday. */
export const notificationDateGroup = (
  date: string,
  now = new Date(),
): NotificationDateGroup => {
  const days = daysAgo(date, now)

  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'

  const weekday = (now.getDay() + 6) % 7

  return days <= weekday ? 'Earlier this week' : 'Older'
}
