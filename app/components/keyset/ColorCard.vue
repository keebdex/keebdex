<template>
  <UPageCard
    :title="code"
    :description="hex"
    reverse
    variant="naked"
    :ui="{
      root: 'w-full',
      container: 'gap-y-2',
      title: 'text-sm font-medium',
      description: 'text-xs text-muted uppercase',
    }"
  >
    <div :style="{ backgroundColor: hex }" class="h-16 rounded" />
  </UPageCard>
</template>

<script setup>
defineProps({
  code: {
    type: String,
    required: true,
  },
  hex: {
    type: String,
    required: true,
  },
})
</script>
