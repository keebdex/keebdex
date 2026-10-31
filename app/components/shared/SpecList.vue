<template>
  <!-- Icon, label, and value per spec (several `values` are choices, one of
       which a build takes, shown as chips): `divide` lines them up in a row with
       subtle separators, `grid` in even columns. Both follow the width they
       are given (container queries), not the screen, so they also fit
       modals and captured images; narrow, they use two columns. -->
  <div class="@container">
    <dl :class="listClass">
      <div v-for="spec in items" :key="spec.term" :class="itemClass">
        <dt class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon v-if="spec.icon" :name="spec.icon" class="size-3.5" />
          {{ spec.term }}
        </dt>
        <dd class="text-sm font-medium text-highlighted">
          <UBadge v-if="spec.badge" v-bind="spec.badge" />
          <ul
            v-else-if="(spec.values?.length || 0) > 1"
            :aria-label="`One of ${spec.description}`"
            class="flex flex-wrap gap-1 pt-0.5"
          >
            <li v-for="value in spec.values" :key="value">
              <UBadge :label="value" size="sm" variant="outline" />
            </li>
          </ul>
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
    // Several are choices (e.g. PCB or plate options), shown as chips
    values?: string[]
    icon?: string
    badge?: BadgeProps
  }[]
  layout?: 'divide' | 'grid'
  // Grid columns once the container is wide enough
  columns?: 3 | 4
}>()

// Full class names, so Tailwind finds them
const gridColumns = { 3: '@md:grid-cols-3', 4: '@md:grid-cols-4' }

const listClass = computed(() =>
  layout === 'grid'
    ? `grid grid-cols-2 gap-x-6 gap-y-3 ${gridColumns[columns]}`
    : 'grid grid-cols-2 gap-y-3 @sm:flex @sm:flex-wrap @sm:divide-x @sm:divide-muted',
)

const itemClass = computed(() =>
  layout === 'grid'
    ? 'space-y-0.5 min-w-0'
    : 'space-y-0.5 @sm:px-6 @sm:first:ps-0',
)
</script>
