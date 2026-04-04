<template>
  <UError
    :redirect="to"
    :error="{
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Sorry, the page you are looking for does not exist.',
    }"
  />
</template>

<script setup>
defineProps({
  to: {
    type: String,
    required: true,
  },
})
</script>
