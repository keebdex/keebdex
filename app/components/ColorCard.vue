<template>
  <!-- <div
    class="flex flex-col border border-muted rounded-lg overflow-hidden w-40 h-60"
  >
    <div :style="{ backgroundColor: hex }" class="flex-1"></div>

    <UPageCard :title="code" :description="name" variant="ghost" />
  </div> -->
  <UPageCard
    :title="code"
    :description="name"
    reverse
    :ui="{
      root: 'w-40',
      container: 'p-2 sm:p-2',
    }"
    variant="ghost"
  >
    <div :style="{ backgroundColor: hex }" class="h-16 rounded"></div>
  </UPageCard>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
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
