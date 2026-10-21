<template>
  <NotificationRow
    :icon="view.icon"
    :icon-class="ICON_CLASSES[view.color]"
    :title="view.title"
    :description="view.description"
    :time="notification.created_at"
    :unread="!notification.read_at"
    :to="view.to"
    to-label="View"
    @go="emit('open', notification)"
  >
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

    <template #actions>
      <UTooltip :text="readLabel">
        <UButton
          :icon="
            notification.read_at
              ? 'hugeicons:mail-01'
              : 'hugeicons:mail-open-01'
          "
          variant="ghost"
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
    </template>
  </NotificationRow>
</template>

<script setup lang="ts">
import type { AppNotification, NotificationColor } from '~/utils/notifications'

// One notification row on /notifications (layout in NotificationRow). A View
// button below the content goes to the target and marks it read; hovering
// (or focusing) the row reveals Mark as read/unread and Delete.
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
