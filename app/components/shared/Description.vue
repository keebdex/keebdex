<template>
  <!-- One paragraph per line; one root, so classes passed in apply -->
  <div class="space-y-2">
    <p v-for="(line, idx) in description.split('\n')" :key="idx">
      {{ line }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  description: {
    type: String,
    default: '',
  },
})
</script>
