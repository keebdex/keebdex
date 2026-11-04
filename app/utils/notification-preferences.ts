import type { NotificationColor } from '~/utils/notifications'

/**
 * Notification preference registry, shared by the settings page and the
 * preferences API. Each key is checked by `push_notification(p_preference)`
 * in the database; a key that is not stored counts as on. To add a kind of
 * notification, add its key here (in an existing or new group) and pass it
 * to `push_notification()` from its trigger. `announcement_toasts` is the
 * exception: `GET /api/announcements` reads it to skip announcement toasts.
 */

export interface NotificationPreferenceItem {
  key: string
  label: string
  // Only when it adds something the label and group don't already say.
  description?: string
  // Shown next to the switch in groups with several items; matches the
  // notification's own icon and color where there is one.
  icon?: string
  color?: NotificationColor
  // Shown only to staff (moderators of some scope).
  staffOnly?: boolean
}

export interface NotificationPreferenceGroup {
  id: string
  label: string
  description: string
  icon: string
  items: NotificationPreferenceItem[]
}

// Site news first, then the user's own activity.
export const NOTIFICATION_PREFERENCE_GROUPS: NotificationPreferenceGroup[] = [
  {
    id: 'announcements',
    label: 'Announcements',
    description:
      'News about Keebdex as toasts when you open the site. Banners at the top of the page stay on, and the Announcements tab always lists everything.',
    icon: 'solar:bell-bing-bold-duotone',
    items: [{ key: 'announcement_toasts', label: 'Toasts' }],
  },
  {
    id: 'submissions',
    label: 'Submissions',
    description: 'Reviews of the colorways, kits, and variants you submit.',
    icon: 'solar:file-check-bold-duotone',
    items: [
      {
        key: 'submission_approved',
        label: 'Approved',
        icon: 'solar:check-circle-bold-duotone',
        color: 'success',
      },
      {
        key: 'submission_rejected',
        label: 'Rejected',
        description: "With the moderator's note.",
        icon: 'solar:close-circle-bold-duotone',
        color: 'error',
      },
      {
        key: 'submission_deleted',
        label: 'Deleted',
        description: "With the moderator's reason, if any.",
        icon: 'solar:trash-bin-minimalistic-bold-duotone',
        color: 'warning',
      },
      {
        key: 'submission_resubmitted',
        label: 'Resubmitted',
        description: 'Submissions you rejected come back for review.',
        icon: 'solar:refresh-bold-duotone',
        color: 'info',
        staffOnly: true,
      },
    ],
  },
  {
    id: 'suggestions',
    label: 'Edit Suggestions',
    description: 'Reviews of the changes you suggest to published records.',
    icon: 'solar:pen-2-bold-duotone',
    items: [
      {
        key: 'suggestion_approved',
        label: 'Approved',
        icon: 'solar:check-circle-bold-duotone',
        color: 'success',
      },
      {
        key: 'suggestion_rejected',
        label: 'Rejected',
        description: "With the moderator's note.",
        icon: 'solar:close-circle-bold-duotone',
        color: 'error',
      },
    ],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    description: 'Feedback you send while signed in, once we resolve it.',
    icon: 'solar:chat-round-question-mark-bold-duotone',
    items: [{ key: 'feedback_resolved', label: 'Resolved' }],
  },
]

export const NOTIFICATION_PREFERENCE_KEYS =
  NOTIFICATION_PREFERENCE_GROUPS.flatMap((group) =>
    group.items.map((item) => item.key),
  )

export type NotificationPreferences = Record<string, boolean>

/** Every known key, on unless `stored` turns it off. */
export const resolveNotificationPreferences = (
  stored: { preference: string; enabled: boolean }[] = [],
): NotificationPreferences => {
  const preferences: NotificationPreferences = Object.fromEntries(
    NOTIFICATION_PREFERENCE_KEYS.map((key) => [key, true]),
  )

  for (const row of stored) {
    if (row.preference in preferences) preferences[row.preference] = row.enabled
  }

  return preferences
}
