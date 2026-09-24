<template>
  <UDashboardPanel id="artisan-submit">
    <template #header>
      <UDashboardNavbar title="Submit a Colorway" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="mx-auto min-w-0 w-full lg:max-w-3xl">
        <template #header>
          Contribute a colorway for a maker and sculpt. It will show with a
          Pending Review badge until a moderator approves it.
        </template>

        <ArtisanModalSubmissionWizard @on-success="onSuccess" />
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
