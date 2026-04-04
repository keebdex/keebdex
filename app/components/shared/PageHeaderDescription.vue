<template>
  <p v-for="(line, idx) in description.split('\n')" :key="idx" class="mb-2">
    {{ line }}
  </p>
</template>

<script setup>
defineProps({
  description: {
    type: String,
    default: () => '',
  },
})
</script>
