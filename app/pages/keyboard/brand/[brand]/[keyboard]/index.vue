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
                :keyboard="data.keyboard"
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
        @on-sorting="sort = $event"
      />

      <UPageList v-if="data.releases?.length" divide class="mt-4">
        <UPageCard
          v-for="(release, idx) in sortedReleases"
          :key="release.id"
          :title="release.name"
          :description="release.description"
          variant="ghost"
          :ui="{
            container: `!px-0 ${idx === 0 ? 'first:pt-0' : ''}`,
          }"
        >
          <div v-if="getReleaseSpecs(release).length" class="mb-4">
            <SharedDescriptionList :items="getReleaseSpecs(release)" />
          </div>

          <template v-if="editable" #footer>
            <div class="flex items-center gap-2">
              <UModal title="Edit Release">
                <UButton
                  icon="hugeicons:edit-01"
                  label="Edit Release"
                  @click="setSelectedRelease(release)"
                />

                <template #body="{ close }">
                  <KeyboardModalReleaseForm
                    :is-edit="true"
                    :metadata="selectedRelease"
                    :keyboard="data.keyboard"
                    :releases="data.releases"
                    @on-success="
                      () => {
                        close()
                        refresh()
                        clearSelectedRelease()
                      }
                    "
                  />
                </template>
              </UModal>

              <UModal title="Add Variant">
                <UButton icon="hugeicons:add-square" label="Add Variant" />

                <template #body="{ close }">
                  <KeyboardModalVariantForm
                    :metadata="{ release_id: release.id }"
                    :keyboard="data.keyboard"
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
              :description="variant.finish_type"
              reverse
              spotlight
              :ui="{
                root: 'h-full',
              }"
            >
              <NuxtImg
                loading="lazy"
                :alt="variant.variant_name"
                :src="variant.image_url || '/keyboard.png'"
                class="aspect-video w-full object-cover"
              />

              <template #footer>
                <div class="flex items-center justify-between gap-2">
                  <SharedSaveToCollection
                    v-if="authenticated"
                    :item="{ ...variant, release_name: release.name }"
                    category="keyboard"
                    label="Save"
                    @on-select="saveToCollection"
                  />

                  <UModal v-if="editable" title="Edit Variant">
                    <UButton
                      icon="hugeicons:edit-01"
                      label="Edit"
                      @click="setSelectedVariant(variant)"
                    />

                    <template #body="{ close }">
                      <KeyboardModalVariantForm
                        :is-edit="true"
                        :metadata="selectedVariant"
                        :releases="data.releases"
                        :keyboard="data.keyboard"
                        @on-success="
                          () => {
                            close()
                            refresh()
                            clearSelectedVariant()
                          }
                        "
                      />
                    </template>
                  </UModal>
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
      />
    </template>
  </UDashboardPanel>
  <SharedRedirectPage v-else :to="`/keyboard/brand/${brand}`" />
</template>

<script setup>
const colorMode = useColorMode()
const route = useRoute()
const userStore = useUserStore()
const { authenticated, user } = storeToRefs(userStore)
const toast = useToast()
const brand = computed(() => String(route.params.brand || ''))
const keyboard = computed(() => String(route.params.keyboard || ''))

const editable = computed(() =>
  userStore.isEditable(`${brand.value}/${keyboard.value}`),
)

const visible = ref({
  addRelease: false,
  editKeyboard: false,
})

const selectedRelease = ref({})
const selectedVariant = ref({})

const sort = ref('order|desc')

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

const sortedReleases = computed(() => {
  const releases = data.value?.releases || []
  const [sortField, sortDir] = sort.value.split('|')

  const sorted = [...releases].sort((a, b) => {
    const aVal = a[sortField] ?? 0
    const bVal = b[sortField] ?? 0

    if (typeof aVal === 'string') {
      return sortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  return sorted
})

const clearSelectedRelease = () => {
  selectedRelease.value = {}
}

const setSelectedRelease = (release) => {
  selectedRelease.value = { ...release }
}

// const createVariant = (releaseId) => {
//   selectedVariant.value = { release_id: releaseId }
//   visible.value.addVariant = true
// }

const clearSelectedVariant = () => {
  selectedVariant.value = {}
}

const setSelectedVariant = (variant) => {
  selectedVariant.value = { ...variant }
}

const saveToCollection = (collection, variant) => {
  const item = {
    uid: user.value.uid,
    collection_id: collection.id,
    keyboard_item_id: variant.id,
  }

  $fetch(`/api/users/${user.value.uid}/collections/${collection.id}/items`, {
    method: 'post',
    body: item,
  })
    .then((result) => {
      if (result?.message) {
        toast.add({
          color: 'info',
          title: result.message,
        })
      } else {
        const contextName = formatKeyboardDescription([
          data.value?.keyboard?.name,
          variant.release_name,
          variant.variant_name,
        ])

        toast.add(
          handleSuccess('add', contextName, 'Keyboard', collection.name),
        )
      }
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}

const formatPrice = (amount, currency = 'USD') => {
  if (!amount || isNaN(amount)) return ''

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

const getReleaseSpecs = (release) => {
  const items = []

  if (release?.release_year) {
    items.push({
      term: 'Release Year',
      description: String(release.release_year),
    })
  }

  if (release?.msrp_price) {
    items.push({
      term: 'Pricing',
      description: formatPrice(release.msrp_price, release.currency),
    })
  }

  if (release?.mount_style) {
    items.push({
      term: 'Mount',
      description: release.mount_style,
    })
  }

  if (release?.pcb_types?.length) {
    items.push({
      term: 'PCB',
      description: release.pcb_types.join(', '),
    })
  }

  if (release?.case_materials?.length) {
    items.push({
      term: 'Case',
      description: release.case_materials.join(', '),
    })
  }

  if (release?.plate_materials?.length) {
    items.push({
      term: 'Plate',
      description: release.plate_materials.join(', '),
    })
  }

  if (release?.weight_materials?.length) {
    items.push({
      term: 'Weight',
      description: release.weight_materials.join(', '),
    })
  }

  return items
}

const description = data.value?.keyboard?.description

useSeoMeta({
  title: computed(() => data.value?.keyboard?.name || 'Keyboard'),
  description,
  ogDescription: description,
  twitterDescription: description,
})
</script>
