<template>
  <div
    class="group relative flex gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-elevated/50 focus-within:bg-elevated/50"
  >
    <UIcon
      :name="announcement.icon || ANNOUNCEMENT_DEFAULT_ICON"
      class="size-5 shrink-0 mt-0.5"
      :class="ICON_CLASSES[announcement.color]"
    />

    <div class="min-w-0 flex-1 space-y-1">
      <p class="flex items-center gap-2 text-sm">
        <span v-if="unread" class="size-2 shrink-0 rounded-full bg-primary" />
        <span v-if="unread" class="sr-only">Unread:</span>
        <span
          class="truncate text-highlighted"
          :class="unread ? 'font-semibold' : 'font-medium'"
        >
          {{ announcement.title }}
        </span>

        <time
          :datetime="announcement.starts_at"
          :title="formatDate(announcement.starts_at)"
          class="ms-auto shrink-0 text-xs text-dimmed"
          :class="
            unread &&
            'group-hover:invisible group-focus-within:invisible [@media(hover:none)]:visible'
          "
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

    <!-- Shown on hover or keyboard focus; always visible on touch screens. -->
    <div
      v-if="unread"
      class="absolute end-2 top-1.5 flex items-center gap-1 rounded-md bg-default p-1 shadow-xs ring ring-default opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:self-start [@media(hover:none)]:opacity-100"
    >
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Announcement, AnnouncementColor } from '~/utils/announcements'

// One announcement in the Announcements tab of /notifications, also used as
// the preview in the admin form. Unread ones show a dot, a bolder title, and
// a Mark as read action on hover (always visible on touch screens). Reading
// is one-way: it dismisses the announcement, which can't be undone.
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
