<template>
  <dl class="grid gap-x-4 gap-y-1 mb-1" :class="columnsClass">
    <template v-for="(item, index) in items" :key="index">
      <div class="grid grid-cols-4 gap-2 px-0 items-center">
        <dt class="text-sm font-medium text-color col-span-1">
          {{ item.term }}
        </dt>
        <dd class="mt-0.5 text-sm col-span-3">
          <template v-if="item.badge">
            <UBadge v-bind="item.badge" />
          </template>
          <template v-else>
            <span class="text-muted">
              {{ item.description }}
            </span>
          </template>
        </dd>
      </div>
    </template>
  </dl>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Number,
    default: undefined,
  },
})

const columnsClass = computed(() => {
  if (Number.isInteger(props.columns) && props.columns > 0) {
    return `grid-cols-${props.columns}`
  }

  return 'grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3'
})
</script>
