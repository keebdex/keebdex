<template>
  <UDashboardPanel id="keyset-submit">
    <template #header>
      <UDashboardNavbar title="Submit a Keyset" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="mx-auto min-w-0 w-full lg:max-w-3xl">
        <template #header>
          Contribute a new keyset and its kits. Submissions are reviewed by our
          staff before they appear publicly.
        </template>

        <KeysetModalKeysetSubmissionForm @on-success="onSuccess" />
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const onSuccess = () => {
  navigateTo('/keyset/submissions')
}
</script>
