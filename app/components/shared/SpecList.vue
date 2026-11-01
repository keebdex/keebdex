<template>
  <!-- Icon, label, and value per spec: `divide` lines them up in a row with
       subtle separators, `grid` in even columns, `rows` one bordered row each
       (label left, value right) in as many columns as fit. All follow the
       width they are given (container queries), not the screen, so they also
       fit modals and captured images; narrow, `divide` and `grid` use two
       columns and `rows` one. -->
  <div class="@container">
    <dl :class="listClass">
      <div v-for="spec in items" :key="spec.term" :class="itemClass">
        <dt :class="termClass">
          <UIcon v-if="spec.icon" :name="spec.icon" :class="iconClass" />
          {{ spec.term }}
        </dt>
        <dd :class="valueClass">
          <UBadge v-if="spec.badge" v-bind="spec.badge" />
          <template v-else>{{ spec.description || '—' }}</template>
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

const { layout = 'divide', columns = 4 } = defineProps<{
  items: {
    term: string
    description?: string | number | null
    icon?: string
    badge?: BadgeProps
  }[]
  layout?: 'divide' | 'grid' | 'rows'
  // Grid columns once the container is wide enough
  columns?: 3 | 4
}>()

// Full class names, so Tailwind finds them
const gridColumns = { 3: '@md:grid-cols-3', 4: '@md:grid-cols-4' }

const listClass = computed(
  () =>
    ({
      divide:
        'grid grid-cols-2 gap-y-3 @sm:flex @sm:flex-wrap @sm:divide-x @sm:divide-muted',
      grid: `grid grid-cols-2 gap-x-6 gap-y-3 ${gridColumns[columns]}`,
      rows: 'grid gap-x-8 border-t border-default @md:grid-cols-2 @3xl:grid-cols-3',
    })[layout],
)

const itemClass = computed(
  () =>
    ({
      divide: 'space-y-0.5 @sm:px-6 @sm:first:ps-0',
      grid: 'space-y-0.5 min-w-0',
      rows: 'flex items-baseline justify-between gap-4 border-b border-default py-2',
    })[layout],
)

const termClass = computed(() =>
  layout === 'rows'
    ? 'flex shrink-0 items-center gap-2 text-sm text-muted'
    : 'flex items-center gap-1.5 text-xs text-muted',
)

const iconClass = computed(() => (layout === 'rows' ? 'size-4' : 'size-3.5'))

const valueClass = computed(() =>
  layout === 'rows'
    ? 'min-w-0 text-end text-sm font-medium text-highlighted'
    : 'text-sm font-medium text-highlighted',
)
</script>
