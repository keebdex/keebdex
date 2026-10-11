<template>
  <div class="flex gap-3 rounded-md px-3 py-2.5">
    <UIcon
      :name="announcement.icon || ANNOUNCEMENT_DEFAULT_ICON"
      class="size-5 shrink-0 mt-0.5"
      :class="ICON_CLASSES[announcement.color]"
    />

    <div class="min-w-0 flex-1 space-y-1">
      <p class="flex items-center gap-2 text-sm">
        <span v-if="isNew" class="size-2 shrink-0 rounded-full bg-primary" />
        <span v-if="isNew" class="sr-only">New:</span>
        <span
          class="truncate text-highlighted"
          :class="isNew ? 'font-semibold' : 'font-medium'"
        >
          {{ announcement.title }}
        </span>

        <time
          :datetime="announcement.starts_at"
          :title="formatDate(announcement.starts_at)"
          class="ms-auto shrink-0 text-xs text-dimmed"
        >
          {{ formatTimeAgo(announcement.starts_at) }}
        </time>
      </p>

      <p v-if="announcement.description" class="text-sm text-muted">
        {{ announcement.description }}
      </p>

      <UButton
        v-if="announcement.cta_label && announcement.cta_url"
        :label="announcement.cta_label"
        v-bind="announcementLink(announcement.cta_url)"
        trailing-icon="hugeicons:arrow-right-02"
        variant="link"
        :color="announcement.color"
        size="sm"
        class="px-0"
        :ui="{ label: 'block' }"
        @click="emit('open')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Announcement, AnnouncementColor } from '~/utils/announcements'

// One announcement in the Announcements tab of /notifications, also used as
// the preview in the admin form. New ones (published since the tab was last
// opened) show a dot and a bolder title.
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
  isNew?: boolean
}>()

// The CTA was clicked.
const emit = defineEmits<{ open: [] }>()

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
