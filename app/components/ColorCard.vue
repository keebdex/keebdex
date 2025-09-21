<template>
  <UPageCard
    :title="code"
    :description="hex"
    reverse
    variant="soft"
    :ui="{
      root: 'w-40',
      container: 'p-2 sm:p-2',
    }"
  >
    <div :style="{ backgroundColor: hex }" class="h-16 rounded"></div>
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
