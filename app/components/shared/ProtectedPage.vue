<template>
  <UDashboardPanel id="protected-page">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar :title="title" />
    </template>

    <template #body>
      <UPageSection v-bind="props" class="mx-auto">
        <template #links>
          <UButton icon="hugeicons:login-03" @click="visible = true">
            Sign In to Continue
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
const props = defineProps({
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
})
const visible = ref(false)
</script>
