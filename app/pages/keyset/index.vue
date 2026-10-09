<template>
  <UDashboardPanel id="keyset-profiles">
    <template #header>
      <UDashboardNavbar title="Keyset Profiles" />
    </template>

    <template #body>
      <template v-if="groups.length">
        <section v-for="[group, items] in groups" :key="group" class="space-y-4">
          <h2 class="text-lg font-semibold text-highlighted">{{ group }}</h2>

          <UPageGrid>
            <SharedKeebLogoCard
              v-for="[id, name] in Object.entries(items)"
              :key="id"
              :title="name"
              :to="`/keyset/${id}`"
              :slug="id"
              aspect="video"
              invertible
            />
          </UPageGrid>
        </section>
      </template>

      <UError
        v-else-if="status !== 'pending'"
        :error="{
          statusCode: 404,
          statusMessage: 'Not Found',
          message: 'No keyset profiles yet. Check back soon.',
        }"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
// Legacy `/keyset?status=…` links point at the group buy tabs.
definePageMeta({
  middleware: [
    (to) => {
      if (to.query.status) {
        return navigateTo(
          { path: '/keyset/group-buy', query: to.query },
          { redirectCode: 301 },
        )
      }
    },
  ],
})

useSeoMeta({
  title: 'Keyset Profiles',
  description:
    'Browse keycap profiles and manufacturers, then drill into each catalog of keysets.',
})

const { groupedProfiles, status } = useKeysetProfiles()

const groups = computed(() => Object.entries(groupedProfiles.value))
</script>
