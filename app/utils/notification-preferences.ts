import type { NotificationColor } from '~/utils/notifications'

/**
 * Notification preference registry, shared by the settings page and the
 * preferences API. Each key is checked by `push_notification(p_preference)`
 * in the database; a key that is not stored counts as on. To add a kind of
 * notification, add its key here (in an existing or new group) and pass it
 * to `push_notification()` from its trigger. `announcement_toasts` is the
 * exception: `GET /api/announcements` reads it to skip homepage toasts.
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
      'News about Keebdex as toasts on the homepage. The Announcements tab always lists them.',
    icon: 'hugeicons:megaphone-01',
    items: [{ key: 'announcement_toasts', label: 'Homepage toasts' }],
  },
  {
    id: 'submissions',
    label: 'Submissions',
    description: 'Reviews of the colorways, kits, and variants you submit.',
    icon: 'hugeicons:file-verified',
    items: [
      {
        key: 'submission_approved',
        label: 'Approved',
        icon: 'hugeicons:checkmark-circle-02',
        color: 'success',
      },
      {
        key: 'submission_rejected',
        label: 'Rejected',
        description: "With the moderator's note.",
        icon: 'hugeicons:cancel-circle',
        color: 'error',
      },
      {
        key: 'submission_deleted',
        label: 'Deleted',
        description: "With the moderator's reason, if any.",
        icon: 'hugeicons:delete-02',
        color: 'warning',
      },
      {
        key: 'submission_resubmitted',
        label: 'Resubmitted',
        description: 'Submissions you rejected come back for review.',
        icon: 'hugeicons:arrow-reload-horizontal',
        color: 'info',
        staffOnly: true,
      },
    ],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    description: 'Feedback you send while signed in, once we resolve it.',
    icon: 'hugeicons:message-question',
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
