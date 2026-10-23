<template>
  <UPageCard
    variant="subtle"
    class="w-full bg-elevated/60 transition-colors duration-200 hover:bg-elevated"
    :ui="{
      root: 'h-full',
      container: 'h-full p-5 sm:p-5',
      body: 'flex h-full flex-col gap-4',
    }"
  >
    <template #body>
      <div v-if="item.rating" class="flex items-center gap-0.5">
        <UIcon
          v-for="index in 5"
          :key="`${item.id}-${index}`"
          name="solar:star-bold"
          class="size-4"
          :class="index <= item.rating ? 'text-warning' : 'text-dimmed'"
        />
      </div>

      <blockquote class="flex-1 text-sm/6 text-toned">
        “{{ item.content }}”
      </blockquote>

      <UUser
        :name="item.name"
        :description="item.role || 'Collector'"
        :avatar="{ src: item.avatar_url || undefined, alt: item.name }"
        :ui="{ name: 'truncate', description: 'truncate' }"
      />
    </template>
  </UPageCard>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
})
</script>
