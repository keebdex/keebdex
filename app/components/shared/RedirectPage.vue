<template>
  <!-- A panel like any page, so the navbar keeps the menu on phones; the
       layout's `*:min-h-0` cancels UError's own min height, so it fills the
       panel body instead to stay centered. -->
  <UDashboardPanel id="not-found">
    <template #header>
      <UDashboardNavbar title="Not Found" />
    </template>

    <template #body>
      <UError
        :redirect="to"
        :error="{
          statusCode: 404,
          statusMessage: 'Not Found',
          message: 'Sorry, the page you are looking for does not exist.',
        }"
        :ui="{ root: 'min-h-0 flex-1' }"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
defineProps({
  to: {
    type: String,
    required: true,
  },
})
</script>
