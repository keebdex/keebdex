<template>
  <div class="flex items-center space-x-3">
    <div :style="{ backgroundColor: color }" class="w-8 h-8 rounded-full" />

    <span class="font-mono">
      {{ color }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  color: {
    type: String,
    required: true,
  },
})
</script>
