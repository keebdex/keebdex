<template>
  <UUser
    :description="color"
    :avatar="{
      style: {
        backgroundColor: color,
      },
    }"
    :ui="{
      description: 'text-sm',
    }"
  />
</template>

<script setup>
defineProps({
  color: {
    type: String,
    required: true,
  },
})
</script>
