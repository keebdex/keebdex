import type {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_COLORS,
} from '~/utils/schemas/announcement'

/**
 * Site-wide announcements (`public.announcements`), shown as homepage toasts
 * and in the Announcements tab of /notifications. `useAnnouncements()` loads
 * and filters them; this file holds what the homepage, the tab, and the admin
 * preview share.
 */

export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number]
export type AnnouncementColor = (typeof ANNOUNCEMENT_COLORS)[number]

export interface Announcement {
  key: string
  title: string
  description: string | null
  icon: string | null
  color: AnnouncementColor
  cta_label: string | null
  cta_url: string | null
  show_toast: boolean
  audience: AnnouncementAudience
  priority: number
  starts_at: string
  ends_at: string | null
}

/** Announcements shown as toasts; more become a "+N more updates" toast. */
export const ANNOUNCEMENT_TOAST_LIMIT = 3

export const ANNOUNCEMENT_SUMMARY_TOAST_ID = 'announcements-more'

export const ANNOUNCEMENT_DEFAULT_ICON = 'hugeicons:megaphone-01'

export const ANNOUNCEMENT_AUDIENCE_LABELS: Record<
  AnnouncementAudience,
  string
> = {
  all: 'Everyone',
  guest: 'Guests',
  signed_in: 'Signed-in users',
  mods: 'Staff',
}

/** Highest priority first, then the newest. */
export const sortAnnouncements = (items: Announcement[]) =>
  [...items].sort(
    (a, b) =>
      b.priority - a.priority || b.starts_at.localeCompare(a.starts_at),
  )

export type AnnouncementStatus = 'scheduled' | 'live' | 'ended'

export const announcementStatus = (
  announcement: Pick<Announcement, 'starts_at' | 'ends_at'>,
  now = Date.now(),
): AnnouncementStatus => {
  if (new Date(announcement.starts_at).getTime() > now) return 'scheduled'
  if (announcement.ends_at && new Date(announcement.ends_at).getTime() <= now) {
    return 'ended'
  }

  return 'live'
}

export const isExternalUrl = (url: string) => url.startsWith('https://')

/** Props for the CTA button: external links open in a new tab. */
export const announcementLink = (url: string) =>
  isExternalUrl(url) ? { to: url, target: '_blank' } : { to: url }

/**
 * The homepage toast of an announcement: no close button and no timeout, so it
 * stays until the CTA or Dismiss is clicked. The key is the toast id, so the
 * same announcement is never shown twice.
 */
export const announcementToast = (
  announcement: Pick<
    Announcement,
    'key' | 'title' | 'description' | 'icon' | 'color' | 'cta_label' | 'cta_url'
  >,
  onDismiss: () => void,
) => ({
  id: announcement.key,
  title: announcement.title,
  description: announcement.description || undefined,
  icon: announcement.icon || ANNOUNCEMENT_DEFAULT_ICON,
  color: announcement.color,
  duration: 0,
  close: false,
  actions: [
    ...(announcement.cta_label && announcement.cta_url
      ? [
          {
            label: announcement.cta_label,
            ...announcementLink(announcement.cta_url),
            trailingIcon: 'hugeicons:arrow-right-02',
            onClick: onDismiss,
            ui: { label: 'block' },
          },
        ]
      : []),
    {
      label: 'Dismiss',
      color: 'neutral' as const,
      variant: 'ghost' as const,
      onClick: onDismiss,
    },
  ],
})

/** The fourth toast when more announcements wait than fit. */
export const announcementSummaryToast = (count: number, to: string) => ({
  id: ANNOUNCEMENT_SUMMARY_TOAST_ID,
  title: `+${count} more ${count === 1 ? 'update' : 'updates'}`,
  description: 'See every announcement in one place.',
  icon: 'hugeicons:megaphone-01',
  color: 'neutral' as const,
  duration: 0,
  actions: [
    {
      label: 'View All',
      to,
      trailingIcon: 'hugeicons:arrow-right-02',
      ui: { label: 'block' },
    },
  ],
})
