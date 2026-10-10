/**
 * Notification preference registry, shared by the settings page and the
 * preferences API. Each key is checked by `push_notification(p_preference)`
 * in the database; a key that is not stored counts as on. To add a kind of
 * notification, add its key here (in an existing or new group) and pass it
 * to `push_notification()` from its trigger.
 */

export interface NotificationPreferenceItem {
  key: string
  label: string
  description: string
}

export interface NotificationPreferenceGroup {
  id: string
  label: string
  description: string
  icon: string
  items: NotificationPreferenceItem[]
}

export const NOTIFICATION_PREFERENCE_GROUPS: NotificationPreferenceGroup[] = [
  {
    id: 'submissions',
    label: 'Submissions',
    description:
      'Reviews of the artisan colorways, keyset kits, and keyboard variants you submit.',
    icon: 'hugeicons:file-verified',
    items: [
      {
        key: 'submission_approved',
        label: 'Approved',
        description: 'A moderator approves one of your submissions.',
      },
      {
        key: 'submission_rejected',
        label: 'Rejected',
        description:
          'A moderator rejects one of your submissions, with their note on what to change.',
      },
    ],
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
