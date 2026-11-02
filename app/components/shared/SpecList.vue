<template>
  <!-- Icon, label, and value per spec: `divide` lines them up in a row with
       subtle separators, `grid` in even columns (three once wide enough), `rows` one bordered row each
       (label left, value right) in as many columns as fit. All follow the
       width they are given (container queries), not the screen, so they also
       fit modals and captured images; narrow, `divide` and `grid` use two
       columns and `rows` one. -->
  <div class="@container">
    <dl :class="ui.list">
      <div v-for="spec in items" :key="spec.term" :class="ui.item">
        <dt :class="ui.term">
          <UIcon v-if="spec.icon" :name="spec.icon" :class="ui.icon" />
          {{ spec.term }}
        </dt>
        <dd :class="ui.value">
          <UBadge v-if="spec.badge" v-bind="spec.badge" />
          <template v-else>{{ spec.description || '—' }}</template>
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

const { layout = 'divide' } = defineProps<{
  items: {
    term: string
    description?: string | number | null
    icon?: string
    badge?: BadgeProps
  }[]
  layout?: 'divide' | 'grid' | 'rows'
}>()

const compact = {
  term: 'flex items-center gap-1.5 text-xs text-muted',
  icon: 'size-3.5',
  value: 'text-sm font-medium text-highlighted',
}

// Every class per layout, as full names so Tailwind finds them
const LAYOUTS = {
  divide: {
    ...compact,
    list: 'grid grid-cols-2 gap-y-3 @sm:flex @sm:flex-wrap @sm:divide-x @sm:divide-muted',
    item: 'space-y-0.5 @sm:px-6 @sm:first:ps-0',
  },
  grid: {
    ...compact,
    list: 'grid grid-cols-2 gap-x-6 gap-y-3 @md:grid-cols-3',
    item: 'space-y-0.5 min-w-0',
  },
  rows: {
    list: 'grid gap-x-8 border-t border-default @md:grid-cols-2 @3xl:grid-cols-3',
    item: 'flex items-baseline justify-between gap-4 border-b border-default py-2',
    term: 'flex shrink-0 items-center gap-2 text-sm text-muted',
    icon: 'size-4',
    value: 'min-w-0 text-end text-sm font-medium text-highlighted',
  },
}

const ui = computed(() => LAYOUTS[layout])
</script>
