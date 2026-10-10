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

      <p
        v-if="view.note"
        class="text-sm text-default border-s-2 border-error/50 ps-2 whitespace-pre-line break-words"
      >
        {{ view.note }}
      </p>
    </div>

    <!-- Shown on hover or keyboard focus; always visible on touch screens. -->
    <div
      class="absolute end-2 top-1.5 flex items-center gap-0.5 rounded-md bg-default p-0.5 shadow-xs ring ring-default opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:self-start [@media(hover:none)]:opacity-100"
    >
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
// focusing) a row reveals Mark as read/unread and Delete. Unread rows show a
// dot and a bolder title.
const props = defineProps<{
  notification: AppNotification
}>()

const emit = defineEmits<{
  'toggle-read': [notification: AppNotification]
  delete: [notification: AppNotification]
}>()

const ICON_CLASSES: Record<NotificationColor, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
}

const view = computed(() => renderNotification(props.notification))

const readLabel = computed(() =>
  props.notification.read_at ? 'Mark as unread' : 'Mark as read',
)
</script>
