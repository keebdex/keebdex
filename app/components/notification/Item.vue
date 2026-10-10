<template>
  <div
    class="group relative flex gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-elevated/50 focus-within:bg-elevated/50"
  >
    <UIcon
      :name="view.icon"
      class="size-5 shrink-0 mt-0.5"
      :class="ICON_CLASSES[view.color]"
    />

    <div class="min-w-0 flex-1 space-y-0.5">
      <p class="flex items-center gap-2 text-sm">
        <span
          v-if="!notification.read_at"
          class="size-2 shrink-0 rounded-full bg-primary"
        />
        <span class="sr-only">{{
          notification.read_at ? 'Read:' : 'Unread:'
        }}</span>
        <span
          class="truncate text-highlighted"
          :class="notification.read_at ? 'font-medium' : 'font-semibold'"
        >
          {{ view.title }}
        </span>

        <time
          :datetime="notification.created_at"
          :title="formatDate(notification.created_at)"
          class="ms-auto shrink-0 text-xs text-dimmed group-hover:invisible group-focus-within:invisible [@media(hover:none)]:visible"
        >
          {{ formatTimeAgo(notification.created_at) }}
        </time>
      </p>

      <p class="text-sm text-muted">{{ view.description }}</p>

      <blockquote
        v-if="view.quote"
        class="text-sm text-muted italic border-s-2 border-default ps-2 whitespace-pre-line break-words line-clamp-3"
      >
        {{ view.quote }}
      </blockquote>

      <p
        v-if="view.note"
        class="text-sm text-default border-s-2 ps-2 whitespace-pre-line break-words"
        :class="NOTE_BORDER_CLASSES[view.color]"
      >
        {{ view.note }}
      </p>
    </div>

    <!-- Shown on hover or keyboard focus; always visible on touch screens. -->
    <div
      class="absolute end-2 top-1.5 flex items-center gap-1 rounded-md bg-default p-1 shadow-xs ring ring-default opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:self-start [@media(hover:none)]:opacity-100"
    >
      <UTooltip v-if="view.to" text="Go to">
        <UButton
          icon="hugeicons:arrow-right-02"
          variant="ghost"
          color="neutral"
          size="xs"
          :to="view.to"
          aria-label="Go to"
          @click="emit('open', notification)"
        />
      </UTooltip>

      <UTooltip :text="readLabel">
        <UButton
          :icon="
            notification.read_at
              ? 'hugeicons:mail-01'
              : 'hugeicons:mail-open-01'
          "
          variant="ghost"
          color="neutral"
          size="xs"
          :aria-label="readLabel"
          @click="emit('toggle-read', notification)"
        />
      </UTooltip>

      <UTooltip text="Delete">
        <UButton
          icon="hugeicons:delete-02"
          variant="ghost"
          color="error"
          size="xs"
          aria-label="Delete notification"
          @click="emit('delete', notification)"
        />
      </UTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppNotification, NotificationColor } from '~/utils/notifications'

// One notification row on /notifications. Rows don't navigate; hovering (or
// focusing) a row reveals Go to (when the notification has a target, and
// marks it read), Mark as read/unread, and Delete. Unread rows show a dot and
// a bolder title.
const props = defineProps<{
  notification: AppNotification
}>()

const emit = defineEmits<{
  open: [notification: AppNotification]
  'toggle-read': [notification: AppNotification]
  delete: [notification: AppNotification]
}>()

const ICON_CLASSES: Record<NotificationColor, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
}

// Tailwind needs the full class names, so they can't be built from the color.
const NOTE_BORDER_CLASSES: Record<NotificationColor, string> = {
  success: 'border-success/50',
  error: 'border-error/50',
  warning: 'border-warning/50',
  info: 'border-info/50',
}

const view = computed(() => renderNotification(props.notification))

const readLabel = computed(() =>
  props.notification.read_at ? 'Mark as unread' : 'Mark as read',
)
</script>
