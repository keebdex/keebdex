<template>
  <UDashboardPanel id="artisan-submit">
    <template #header>
      <UDashboardNavbar title="Submit a Colorway" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="mx-auto min-w-0 w-full lg:max-w-3xl">
        <template #header>
          Contribute a colorway for an existing maker and sculpt. It will show
          with a Pending Review badge until a moderator approves it.
        </template>

        <UPageSection
          v-if="!hasSculptContext"
          icon="hugeicons:paint-board"
          title="Pick a Sculpt First"
          description="Open a sculpt page and use its Submit Colorway button to contribute a colorway for it."
          :links="[
            {
              label: 'Browse Makers',
              to: '/artisan/maker',
              icon: 'hugeicons:user-multiple',
              variant: 'soft',
            },
          ]"
          :ui="{
            title: 'text-base! text-toned',
            description: 'text-sm!',
          }"
        />

        <ArtisanModalArtisanSubmissionForm v-else @on-success="onSuccess" />
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()

const hasSculptContext = computed(
  () => !!route.query.maker && !!route.query.sculpt,
)

const onSuccess = () => {
  navigateTo('/artisan/submissions')
}
</script>
