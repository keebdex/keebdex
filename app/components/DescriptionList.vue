<template>
  <dl class="space-y-1 mb-1">
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
defineProps({
  items: {
    type: Array,
    required: true,
    default: () => [],
  },
})
</script>
