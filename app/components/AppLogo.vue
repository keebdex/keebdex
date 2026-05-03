<template>
  <!-- Icon mark — shown when sidebar is collapsed -->
  <AppFaviconLogo v-if="props.collapsed" size="sm" framed variant="light" />

  <!-- Wordmark — shown when sidebar is expanded -->
  <AppWordmark v-else />
</template>

<script setup>
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
})
</script>
