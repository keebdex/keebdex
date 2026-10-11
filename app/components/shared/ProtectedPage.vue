<template>
  <UDashboardPanel id="protected-page">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar :title="navTitle || title" />
    </template>

    <template #body>
      <UPageSection
        :icon="icon"
        :title="title"
        :description="description"
        :features="features"
        class="mx-auto"
      >
        <template #links>
          <UButton icon="hugeicons:login-01" @click="visible = true">
            {{ signInLabel }}
          </UButton>
        </template>
      </UPageSection>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="visible">
    <template #content>
      <UPageCard>
        <ModalLogin />
      </UPageCard>
    </template>
  </UModal>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: undefined,
  },
  title: {
    type: String,
    default: undefined,
  },
  description: {
    type: String,
    default: undefined,
  },
  // `UPageSection` features (`{ icon, title, description }`) to show what
  // signing in unlocks.
  features: {
    type: Array,
    default: undefined,
  },
  // Page name in the mobile navbar when the headline is a pitch.
  navTitle: {
    type: String,
    default: undefined,
  },
  signInLabel: {
    type: String,
    default: 'Sign In to Continue',
  },
})
const visible = ref(false)
</script>
