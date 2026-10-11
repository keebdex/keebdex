<template>
  <UPageGrid
    :class="{
      grid: hasFixedColumns,
      [gap]: hasFixedColumns,
    }"
    :style="gridStyle"
  >
    <UPageCard
      v-for="(item, index) in items"
      :key="index"
      :title="item.term"
      :description="item.description ? item.description.toString() : undefined"
      variant="naked"
      :ui="
        rowLayout
          ? {
              body: 'grid grid-cols-[minmax(7rem,10rem)_minmax(0,1fr)] items-start gap-x-4 w-full',
              title: 'text-sm font-medium text-muted',
              description: 'text-sm mt-0 break-words',
            }
          : {
              title: 'text-xs text-muted',
              description: 'text-sm',
            }
      "
    >
      <template v-if="item.badge" #description>
        <UBadge v-bind="item.badge" />
      </template>
    </UPageCard>
  </UPageGrid>
</template>

<script setup>
const { columns, orientation, responsive } = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Number,
    default: undefined,
  },
  orientation: {
    type: String,
    default: 'vertical',
  },
  // Switch to term/description rows on phones; off for fixed-width images.
  responsive: {
    type: Boolean,
    default: true,
  },
})

const { isMobile } = useDevice()

const rowLayout = computed(
  () => (responsive && isMobile) || orientation === 'horizontal',
)

const hasFixedColumns = computed(() => Number.isInteger(columns) && columns > 0)

const gridStyle = computed(() => {
  if (!hasFixedColumns.value) return undefined

  return {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  }
})

const gap = computed(() => (rowLayout.value ? 'gap-x-4 gap-y-2' : 'gap-4'))
</script>
