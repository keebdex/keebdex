<template>
  <UDashboardPanel id="keyboard-brands">
    <template #header>
      <UDashboardNavbar title="Keyboard Brands">
        <template #right>
          <UModal
            v-if="editable"
            v-model:visible="visible"
            title="Add Keyboard Brand"
          >
            <UButton color="primary" icon="hugeicons:add-team" label="Add" />

            <template #body="{ close }">
              <KeyboardModalBrandForm
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid
        v-if="data?.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-6 gap-4"
      >
        <KeyboardBrandCard
          v-for="brand in data"
          :key="brand.slug"
          :brand="brand"
        />
      </UPageGrid>

      <UError
        v-else
        :error="{
          statusCode: 404,
          statusMessage: 'Not Found',
          message:
            'No keyboard brands yet. Add the first brand to get started.',
        }"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
useSeoMeta({
  title: 'Keyboard Brands',
  description:
    'Browse keyboard brands, then drill into each catalog to manage boards, releases, and variants.',
})

const { data, refresh } = await useAsyncData('keyboard-brands', () =>
  $fetch('/api/keyboards/brands'),
)

const userStore = useUserStore()
const editable = computed(() => userStore.isEditable('keyboard'))

const visible = ref(false)
</script>
