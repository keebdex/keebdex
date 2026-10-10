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
        <NuxtLink
          v-if="view.to"
          :to="view.to"
          class="font-medium text-highlighted truncate focus:outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-primary"
          @click="emit('open', notification)"
        >
          {{ view.title }}
        </NuxtLink>
        <span v-else class="font-medium text-highlighted truncate">
          {{ view.title }}
        </span>

        <time
          :datetime="notification.created_at"
          :title="formatDate(notification.created_at)"
          class="ms-auto shrink-0 text-xs text-dimmed"
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

    <UTooltip
      :text="notification.read_at ? 'Mark as unread' : 'Mark as read'"
      :content="{ side: 'left' }"
    >
      <UButton
        variant="ghost"
        color="neutral"
        size="xs"
        class="relative z-10 shrink-0 self-start"
        :aria-label="notification.read_at ? 'Mark as unread' : 'Mark as read'"
        @click="emit('toggle-read', notification)"
      >
        <span
          class="size-2 rounded-full"
          :class="
            notification.read_at
              ? 'ring-1 ring-inset ring-(--ui-border-accented)'
              : 'bg-primary'
          "
        />
      </UButton>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import type { AppNotification, NotificationColor } from '~/utils/notifications'

// One notification row on /notifications. The title links to the
// notification's target (the whole row is clickable); the dot on the right
// toggles read/unread.
const props = defineProps<{
  notification: AppNotification
}>()

const emit = defineEmits<{
  open: [notification: AppNotification]
  'toggle-read': [notification: AppNotification]
}>()

const ICON_CLASSES: Record<NotificationColor, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
}

const view = computed(() => renderNotification(props.notification))
</script>
