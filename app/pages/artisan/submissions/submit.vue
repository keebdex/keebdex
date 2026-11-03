<template>
  <UDashboardPanel id="artisan-submit">
    <template #header>
      <UDashboardNavbar title="Submit an Artisan" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="min-w-0">
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

useSeoMeta({ title: 'Submit an Artisan' })

const onSuccess = () => {
  navigateTo('/artisan/submissions')
}
</script>
