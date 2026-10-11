<template>
  <NotificationRow
    :icon="announcement.icon || ANNOUNCEMENT_DEFAULT_ICON"
    :icon-class="ICON_CLASSES[announcement.color]"
    :title="announcement.title"
    :description="announcement.description"
    :time="announcement.starts_at"
    :unread="unread"
    :to="announcement.cta_url"
    :to-label="announcement.cta_label"
    @go="emit('open')"
  >
    <template v-if="unread" #actions>
      <UTooltip text="Mark as read">
        <UButton
          icon="hugeicons:mail-open-01"
          variant="ghost"
          color="neutral"
          size="xs"
          aria-label="Mark as read"
          @click="emit('read')"
        />
      </UTooltip>
    </template>
  </NotificationRow>
</template>

<script setup lang="ts">
import type { Announcement, AnnouncementColor } from '~/utils/announcements'

// One announcement in the Announcements tab of /notifications (layout in
// NotificationRow, like notifications), also used as the preview in the admin
// form. The CTA is the button below. Unread (not dismissed) ones reveal Mark
// as read on hover; reading dismisses the announcement, which can't be undone.
defineProps<{
  announcement: Pick<
    Announcement,
    | 'title'
    | 'description'
    | 'icon'
    | 'color'
    | 'cta_label'
    | 'cta_url'
    | 'starts_at'
  >
  unread?: boolean
}>()

// open: the CTA was clicked; read: Mark as read.
const emit = defineEmits<{ open: []; read: [] }>()

// Tailwind needs the full class names, so they can't be built from the color.
const ICON_CLASSES: Record<AnnouncementColor, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  error: 'text-error',
  neutral: 'text-highlighted',
}
</script>
