<template>
  <UPageGrid :class="columnsClass">
    <UPageCard
      v-for="(item, index) in items"
      :key="index"
      :title="item.term"
      :description="item.description"
      variant="naked"
      :ui="
        isMobile || orientation === 'horizontal'
          ? {
              body: 'flex flex-row items-center justify-between w-full',
              title: 'text-sm font-medium text-muted',
              description: 'text-sm mt-0',
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
const { columns, orientation } = defineProps({
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
})

const { isMobile } = useDevice()

const gap = computed(() =>
  isMobile || orientation === 'horizontal' ? 'gap-x-4 gap-y-2' : 'gap-4',
)

const columnsClass = computed(() => {
  if (Number.isInteger(columns) && columns > 0) {
    return `grid grid-cols-${columns} sm:grid-cols-${columns} md:grid-cols-${columns} lg:grid-cols-${columns} 2xl:grid-cols-${columns} 4xl:grid-cols-${columns} ${gap.value}`
  }

  return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-6 ${gap.value}`
})
</script>
