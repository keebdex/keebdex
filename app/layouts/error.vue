<template>
  <UError
    v-if="error.statusCode === 404"
    :error="{
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Sorry, the page you are looking for does not exist.',
    }"
  />
  <UError
    v-else
    :error="{
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Uh oh. Something went wrong.',
    }"
  />
</template>

<script>
export default {
  // eslint-disable-next-line vue/require-prop-types
  props: ['error'],
}
</script>
