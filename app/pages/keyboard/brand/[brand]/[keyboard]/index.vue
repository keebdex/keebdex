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

          <UButton
            v-if="editable"
            :to="`/keyboard/brand/${brand}/${keyboard}/sort`"
            :icon="appConfig.ui.icons.sortManual"
            label="Sort"
          />

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

          <USelect
            v-if="$device.isDesktopOrTablet"
            v-model="sort"
            :items="sortOptions"
            :icon="sortIconMap[sort]"
            variant="soft"
            :ui="{ content: 'min-w-fit' }"
          />

          <SharedProfileDrawer
            v-if="data.keyboard.description"
            :title="data.keyboard.name"
            :description="data.keyboard.description"
            :links="keyboardLinks"
          />

          <UDropdownMenu v-if="items.length" :items="items">
            <UButton label="More" trailing-icon="hugeicons:arrow-down-01" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="$device.isMobile">
        <USelect
          v-model="sort"
          :items="sortOptions"
          :icon="sortIconMap[sort]"
          variant="soft"
          :ui="{ content: 'min-w-fit' }"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageList v-if="data.releases?.length" divide class="mt-4">
        <UPageCard
          v-for="(release, idx) in data.releases"
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
                root: 'h-full flex flex-col',
                container: 'h-full grid grid-rows-[auto_minmax(0,1fr)]',
              }"
            >
              <NuxtImg
                loading="lazy"
                :alt="variant.variant_name"
                :src="variant.image_url || '/keyboard.png'"
                class="aspect-video w-full object-cover"
              />

              <template v-if="variant.photo_credit" #leading>
                <UBadge
                  :label="variant.photo_credit"
                  icon="hugeicons:camera-add-02"
                  color="info"
                />
              </template>

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
const appConfig = useAppConfig()

const sortOptions = [
  {
    label: 'Oldest First',
    icon: appConfig.ui.icons.sortNumberAsc,
    value: 'order|asc',
  },
  {
    label: 'Newest First',
    icon: appConfig.ui.icons.sortNumberDesc,
    value: 'order|desc',
  },
]

const sortIconMap = getSortIconMap(sortOptions)

const { data, refresh } = await useAsyncData(
  () => `keyboard:${brand.value}/${keyboard.value}`,
  () => $fetch(`/api/keyboards/${brand.value}/${keyboard.value}`),
  {
    watch: [brand, keyboard],
  },
)

const items = computed(() => {
  if (data.value.keyboard.derived_from) {
    return [
      {
        label: 'Original Design',
        type: 'label',
      },
      {
        label: `${data.value.keyboard.original.brand.name} ${data.value.keyboard.original.name}`,
        icon: 'hugeicons:keyboard',
        to: `/keyboard/brand/${data.value.keyboard.derived_from}`,
      },
    ]
  }

  return []
})

const breadcrumbs = computed(() => {
  return [
    {
      label: 'Brands',
      to: '/keyboard/brand',
      icon: 'hugeicons:user-group-03',
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
            data.value?.brand?.invertible_logo && colorMode.value === 'dark'
              ? 'rounded-none invert'
              : 'rounded-none',
        },
      },
    },
    {
      label: data.value?.keyboard?.name,
    },
  ]
})

const keyboardLinks = computed(() => {
  const links = []

  if (data.value?.keyboard?.derived_from) {
    links.push({
      label: `${data.value.keyboard.original.brand.name} ${data.value.keyboard.original.name}`,
      icon: 'hugeicons:share-knowledge',
      to: `/keyboard/brand/${data.value.keyboard.derived_from}`,
    })
  }

  return links
})

const clearSelectedRelease = () => {
  selectedRelease.value = {}
}

const setSelectedRelease = (release) => {
  selectedRelease.value = { ...release }
}

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

const title = computed(() => {
  return `${data.value?.brand?.name} ${data.value?.keyboard?.name}`
})

const description = computed(() => {
  if (data.value?.description) {
    return data.value.description
  }

  return `Explore ${data.value?.keyboard?.name} from ${data.value?.brand?.name} and discover its unique features, designs, and innovations in the world of mechanical keyboards.`
})

useSeoMeta({
  title: title.value,
  description: description.value,
  ogDescription: description.value,
  twitterDescription: description.value,
})

defineOgImage('Module', {
  title: data.value?.keyboard?.name,
  description: description.value,
  headline: data.value?.brand?.name,
  headlineLogo: `/logo/${data.value?.brand?.slug}.png`,
})
</script>
