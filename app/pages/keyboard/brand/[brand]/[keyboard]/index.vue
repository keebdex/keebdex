<template>
  <UDashboardPanel v-if="data" :id="`keyboard-${brand}-${keyboard}`">
    <template #header>
      <UDashboardNavbar :title="data.keyboard.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="editable"
            v-model:visible="visible.addRelease"
            title="Add Release"
          >
            <UButton
              color="primary"
              icon="hugeicons:delivery-view-01"
              label="Add Release"
            />

            <template #body="{ close }">
              <KeyboardModalReleaseForm
                :brand-slug="brand"
                :keyboard-slug="keyboard"
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>

          <UModal
            v-if="editable"
            v-model:visible="visible.addVariant"
            title="Add Variant"
          >
            <UButton
              color="secondary"
              icon="hugeicons:ai-image"
              label="Add Variant"
            />

            <template #body="{ close }">
              <KeyboardModalVariantForm
                :brand-slug="brand"
                :keyboard-slug="keyboard"
                :releases="data.releases"
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>

          <UModal
            v-if="editable"
            v-model:visible="visible.editKeyboard"
            title="Edit Keyboard"
          >
            <UButton icon="hugeicons:edit-01" label="Edit" />

            <template #body="{ close }">
              <KeyboardModalKeyboardForm
                :is-edit="true"
                :metadata="data.keyboard"
                :brand-slug="brand"
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
      <UPageHeader :title="data.keyboard.name" :description="headerDescription">
        <template #links>
          <UBadge
            color="neutral"
            variant="soft"
            :label="data.keyboard.layout"
          />
          <UBadge
            color="neutral"
            variant="soft"
            :label="`${data.releases.length} releases`"
          />
          <UBadge
            color="neutral"
            variant="soft"
            :label="`${totalVariants} variants`"
          />
        </template>
      </UPageHeader>

      <NuxtImg
        v-if="data.keyboard.cover_image"
        loading="lazy"
        :alt="data.keyboard.name"
        :src="data.keyboard.cover_image"
        class="mb-6 w-full max-h-80 rounded-lg border border-default object-cover"
      />

      <UPageGrid
        v-if="data.releases?.length"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        <UPageCard
          v-for="release in data.releases"
          :key="release.id"
          :title="release.label || `Release #${release.id}`"
          :description="
            release.description ||
            `${release.release_year || 'Year TBD'} • ${release.mount_style || 'Mount TBD'}`
          "
          icon="hugeicons:delivery-view-01"
          spotlight
        >
          <template #footer>
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <UBadge
                  v-if="release.release_year"
                  color="neutral"
                  variant="soft"
                  :label="String(release.release_year)"
                />
                <UBadge
                  v-if="release.mount_style"
                  color="neutral"
                  variant="soft"
                  :label="release.mount_style"
                />
                <UBadge
                  color="neutral"
                  variant="soft"
                  :label="`${release.variants?.length || 0} variants`"
                />
              </div>

              <div v-if="editable" class="flex gap-2">
                <UButton
                  size="xs"
                  variant="soft"
                  icon="hugeicons:edit-01"
                  label="Edit Release"
                  @click="editRelease(release)"
                />
                <UButton
                  size="xs"
                  variant="soft"
                  icon="hugeicons:add-square"
                  label="Add Variant"
                  @click="createVariant(release.id)"
                />
              </div>

              <div v-if="release.variants?.length" class="space-y-2 pt-1">
                <div
                  v-for="variant in release.variants"
                  :key="variant.id"
                  class="border border-default rounded-md p-2"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-sm font-medium">
                        {{ variant.variant_name }}
                      </p>
                      <p class="text-xs text-muted">
                        {{ variant.finish_type }}
                        <template v-if="variant.default_weight_material">
                          • {{ variant.default_weight_material }}
                        </template>
                      </p>
                    </div>

                    <div class="flex items-center gap-1">
                      <UBadge
                        v-if="variant.msrp_price"
                        color="primary"
                        variant="soft"
                        :label="
                          formatPrice(variant.msrp_price, variant.currency)
                        "
                      />
                      <UButton
                        v-if="editable"
                        size="xs"
                        variant="ghost"
                        icon="hugeicons:edit-01"
                        @click="editVariant(variant)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <UAlert
                v-else
                title="No variants"
                icon="hugeicons:information-circle"
                color="neutral"
                variant="soft"
              />
            </div>
          </template>
        </UPageCard>
      </UPageGrid>

      <UAlert
        v-else
        title="No releases yet"
        description="Add the first release to start cataloging this keyboard."
        icon="hugeicons:information-circle"
        color="info"
        variant="soft"
      />

      <UModal v-model:visible="visible.editRelease" title="Edit Release">
        <template #body="{ close }">
          <KeyboardModalReleaseForm
            :is-edit="true"
            :metadata="selectedRelease"
            :brand-slug="brand"
            :keyboard-slug="keyboard"
            @on-success="
              () => {
                close()
                refresh()
              }
            "
          />
        </template>
      </UModal>

      <UModal v-model:visible="visible.editVariant" title="Edit Variant">
        <template #body="{ close }">
          <KeyboardModalVariantForm
            :is-edit="true"
            :metadata="selectedVariant"
            :releases="data.releases"
            :brand-slug="brand"
            :keyboard-slug="keyboard"
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
  </UDashboardPanel>
  <SharedRedirectPage v-else :to="`/keyboard/brand/${brand}`" />
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()
const brand = computed(() => String(route.params.brand || ''))
const keyboard = computed(() => String(route.params.keyboard || ''))

const editable = computed(() =>
  userStore.isEditable(`${brand.value}/${keyboard.value}`),
)

const visible = ref({
  addRelease: false,
  addVariant: false,
  editKeyboard: false,
  editRelease: false,
  editVariant: false,
})

const selectedRelease = ref({})
const selectedVariant = ref({})

const { data, refresh } = await useAsyncData(
  () => `keyboard:${brand.value}/${keyboard.value}`,
  () => $fetch(`/api/keyboards/${brand.value}/${keyboard.value}`),
  {
    watch: [brand, keyboard],
  },
)

const breadcrumbs = computed(() => {
  return [
    {
      label: 'Keyboard Brands',
      to: '/keyboard/brand',
      icon: 'hugeicons:keyboard',
    },
    {
      label: data.value?.brand?.name,
      to: `/keyboard/brand/${brand.value}`,
    },
    {
      label: data.value?.keyboard?.name,
    },
  ]
})

const totalVariants = computed(() => {
  return (data.value?.releases || []).reduce(
    (sum, release) => sum + (release.variants?.length || 0),
    0,
  )
})

const headerDescription = computed(() => {
  if (!data.value?.keyboard) return ''

  return `${data.value.brand?.name || ''} • ${data.value.keyboard.layout} layout • ${data.value.releases?.length || 0} releases`
})

const editRelease = (release) => {
  selectedRelease.value = { ...release }
  visible.value.editRelease = true
}

const createVariant = (releaseId) => {
  selectedVariant.value = { release_id: releaseId }
  visible.value.addVariant = true
}

const editVariant = (variant) => {
  selectedVariant.value = { ...variant }
  visible.value.editVariant = true
}

const formatPrice = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || amount === '') return ''

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

useSeoMeta({
  title: computed(() => data.value?.keyboard?.name || 'Keyboard'),
  description: headerDescription,
  ogDescription: headerDescription,
  twitterDescription: headerDescription,
})
</script>
