<template>
  <button
    type="button"
    :aria-current="selected || undefined"
    :class="[
      'relative w-full overflow-hidden rounded-lg border px-4 py-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-primary',
      selected
        ? 'border-primary/60 bg-primary/5'
        : 'border-default bg-default hover:bg-elevated/50',
    ]"
    @click="emit('select')"
  >
    <span
      v-if="selected"
      class="absolute inset-y-0 start-0 w-1 bg-primary"
      aria-hidden="true"
    />

    <span class="flex items-center gap-3">
      <UTooltip :text="iconLabel">
        <UAvatar
          :icon="icon"
          role="img"
          :aria-label="iconLabel"
          :ui="{ icon: selected ? 'text-primary' : undefined }"
          class="shrink-0"
        />
      </UTooltip>

      <span
        :class="[
          'min-w-0 flex-1 truncate font-semibold',
          selected ? 'text-primary' : 'text-highlighted',
        ]"
      >
        {{ title }}
      </span>

      <UIcon
        name="hugeicons:arrow-right-01"
        :class="['size-4 shrink-0', selected ? 'text-primary' : 'text-dimmed']"
      />
    </span>

    <span
      class="mt-3 flex items-center justify-between gap-2 border-t border-default pt-2.5 text-xs text-muted"
    >
      <span class="min-w-0 truncate">
        <SharedRevisionAuthors :revisions="revisions" />
        <template v-if="verb">{{ verb }}</template>
        ·
        <time :datetime="date" :title="formatDateTime(date)">
          {{ formatTimeAgo(date) }}
        </time>
      </span>

      <UBadge
        v-if="badge"
        :label="badge"
        color="primary"
        variant="subtle"
        size="sm"
        class="shrink-0 rounded-full"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import type { Revision } from '~/utils/revisions'

// A row of the revision lists (History, Recent Changes) as a card: an icon
// avatar named by its tooltip (the module, or the record's kind), the title,
// then who made the revisions, what they did (`verb`), when, and an optional
// badge (how many changes). The selected one is outlined in the primary
// color with a bar on its edge. Emits `select`.
defineProps<{
  icon: string
  iconLabel: string
  title: string
  revisions: Revision[]
  date: string
  verb?: string
  badge?: string
  selected?: boolean
}>()

const emit = defineEmits<{ select: [] }>()
</script>
