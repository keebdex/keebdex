<template>
  <UUser
    :name="name"
    :description="color"
    :avatar="{
      style: {
        backgroundColor: color,
      },
      ui: {
        fallback: 'hidden',
      },
    }"
    :ui="{
      description: !name && 'text-sm',
    }"
  />
</template>

<script setup>
defineProps({
  color: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false,
  },
})
</script>
