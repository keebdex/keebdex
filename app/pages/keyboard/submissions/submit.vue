<template>
  <UDashboardPanel id="keyboard-submit">
    <template #header>
      <UDashboardNavbar title="Submit a Keyboard" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="mx-auto min-w-0 w-full lg:max-w-3xl">
        <template #header>
          Contribute a keyboard and one of its releases. Submissions are
          reviewed by our staff before they appear publicly.
        </template>

        <KeyboardModalSubmissionWizard @on-success="onSuccess" />
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const onSuccess = () => {
  navigateTo('/keyboard/submissions')
}
</script>
