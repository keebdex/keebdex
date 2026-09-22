<template>
  <UDashboardPanel id="artisan-submit">
    <template #header>
      <UDashboardNavbar title="Submit a Colorway" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="mx-auto min-w-0 w-full lg:max-w-3xl">
        <template #header>
          Contribute a colorway for an existing maker and sculpt. Submissions
          are reviewed by our staff before they appear publicly.
        </template>

        <ArtisanModalArtisanSubmissionForm @on-success="onSuccess" />
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const onSuccess = () => {
  navigateTo('/artisan/submissions')
}
</script>
