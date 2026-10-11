<template>
  <div
    class="group relative flex gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-elevated/50 focus-within:bg-elevated/50"
  >
    <UIcon :name="icon" class="size-5 shrink-0 mt-0.5" :class="iconClass" />

    <div class="min-w-0 flex-1 space-y-1">
      <p class="flex items-center gap-2 text-sm">
        <span v-if="unread" class="size-2 shrink-0 rounded-full bg-primary" />
        <span class="sr-only">{{ unread ? 'Unread:' : 'Read:' }}</span>
        <span
          class="truncate text-highlighted"
          :class="unread ? 'font-semibold' : 'font-medium'"
        >
          {{ title }}
        </span>

        <time
          :datetime="time"
          :title="formatDate(time)"
          class="ms-auto shrink-0 text-xs text-dimmed"
          :class="
            $slots.actions &&
            'group-hover:invisible group-focus-within:invisible [@media(hover:none)]:visible'
          "
        >
          {{ formatTimeAgo(time) }}
        </time>
      </p>

      <p v-if="description" class="text-sm text-muted">{{ description }}</p>

      <slot />

      <UButton
        v-if="to && toLabel"
        :label="toLabel"
        v-bind="announcementLink(to)"
        trailing-icon="hugeicons:arrow-right-02"
        variant="link"
        color="primary"
        size="sm"
        class="px-0"
        :ui="{ label: 'block' }"
        @click="emit('go')"
      />
    </div>

    <!-- Shown on hover or keyboard focus; always visible on touch screens. -->
    <div
      v-if="$slots.actions"
      class="absolute end-2 top-1.5 flex items-center gap-1 rounded-md bg-default p-1 shadow-xs ring ring-default opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:self-start [@media(hover:none)]:opacity-100"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
// The row layout shared by notifications and announcements on
// /notifications: icon, title with an unread dot and time, description,
// extra content (default slot), a link button below (`to` + `toLabel`), and
// hover actions (`actions` slot; always visible on touch screens). Rows
// themselves don't navigate.
defineProps<{
  icon: string
  iconClass?: string
  title: string
  description?: string | null
  time: string
  unread?: boolean
  to?: string | null
  toLabel?: string | null
}>()

// The link button below was clicked.
const emit = defineEmits<{ go: [] }>()
</script>
