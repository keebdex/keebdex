<template>
  <UDashboardPanel id="keyboard-submit">
    <template #header>
      <UDashboardNavbar title="Submit a Keyboard" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="min-w-0">
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

useSeoMeta({ title: 'Submit a Keyboard' })

const onSuccess = () => {
  navigateTo('/keyboard/submissions')
}
</script>
