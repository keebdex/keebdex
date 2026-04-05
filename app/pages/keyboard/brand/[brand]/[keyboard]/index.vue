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
      <KeyboardPageHeader
        :brand="data.brand"
        :keyboard="data.keyboard"
        :releases="data.releases"
        :total-variants="totalVariants"
      />

      <UPageList v-if="data.releases?.length" divide>
        <UPageCard
          v-for="release in data.releases"
          :key="release.id"
          :title="release.label || 'R1'"
          :description="release.description"
          spotlight
          class="not-last:pb-4"
        >
          <template #footer>
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
          </template>

          <UPageGrid
            v-if="release.variants?.length"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-6 gap-4"
          >
            <UPageCard
              v-for="variant in release.variants"
              :key="variant.id"
              :title="variant.variant_name"
              :description="
                variant.default_weight_material
                  ? `${variant.finish_type} • ${variant.default_weight_material}`
                  : variant.finish_type
              "
              reverse
              :ui="{
                root: 'h-full',
              }"
            >
              <NuxtImg
                v-if="variant.image_url"
                loading="lazy"
                :alt="variant.variant_name"
                :src="variant.image_url"
                class="aspect-[16/9] w-full object-cover"
              />

              <template #footer>
                <div class="flex items-center justify-between gap-2">
                  <UBadge
                    v-if="variant.msrp_price"
                    color="primary"
                    variant="soft"
                    :label="formatPrice(variant.msrp_price, variant.currency)"
                  />
                  <UButton
                    v-if="editable"
                    size="xs"
                    variant="ghost"
                    icon="hugeicons:edit-01"
                    @click="editVariant(variant)"
                  />
                </div>
              </template>
            </UPageCard>
          </UPageGrid>
        </UPageCard>
      </UPageList>

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
const colorMode = useColorMode()
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
      avatar: {
        src: `/logo/${data.value?.brand?.slug}.png`,
        alt: data.value?.brand?.name,
        ui: {
          root: 'bg-transparent',
          image:
            colorMode.value === 'dark' ? 'rounded-none invert' : 'rounded-none',
        },
      },
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

// const editRelease = (release) => {
//   selectedRelease.value = { ...release }
//   visible.value.editRelease = true
// }

// const createVariant = (releaseId) => {
//   selectedVariant.value = { release_id: releaseId }
//   visible.value.addVariant = true
// }

const editVariant = (variant) => {
  selectedVariant.value = { ...variant }
  visible.value.editVariant = true
}

const formatPrice = (amount, currency = 'USD') => {
  if (!amount || isNaN(amount)) return ''

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

const description = data.value?.keyboard?.description

useSeoMeta({
  title: computed(() => data.value?.keyboard?.name || 'Keyboard'),
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
