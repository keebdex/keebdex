<template>
  <UPageCard
    variant="subtle"
    class="w-full bg-elevated/60 transition-all duration-200 hover:-translate-y-1 hover:bg-elevated/80 hover:shadow-lg"
    :ui="{
      root: 'h-full',
      body: 'p-4',
    }"
  >
    <template #body>
      <div class="flex items-start gap-3">
        <UAvatar
          :src="item.avatar_url || undefined"
          :alt="item.name"
          size="lg"
        />

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-highlighted">
            {{ item.name }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ item.role || 'Collector' }}
          </p>
        </div>
      </div>

      <p class="mt-3 text-sm text-toned text-justify italic">
        "{{ item.content }}"
      </p>

      <div v-if="item.rating" class="mt-3 flex items-center gap-1">
        <UIcon
          v-for="index in 5"
          :key="`${item.id}-${index}`"
          name="solar:star-bold-duotone"
          class="size-4"
          :class="index <= item.rating ? 'text-warning' : 'text-muted'"
        />
      </div>
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
