<template>
  <UDashboardPanel v-if="data" :id="`keyboard-${slug}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
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
                :keyboard="data"
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
            :to="`/keyboard/brand/${slug}/sort`"
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
                :metadata="data"
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

          <USlideover
            v-if="data.derived_keyboards?.length"
            title="Derived Designs"
            description="A collection of keyboards that share this design's DNA through community reworks, official collaborations, and specialized iterations."
          >
            <UButton label="Derived" icon="hugeicons:archive-02" />

            <template #body>
              <UPageList class="flex gap-4">
                <UPageCard
                  v-for="keyboard in data.derived_keyboards"
                  :key="keyboard.brand_keyboard_slug"
                  :to="`/keyboard/brand/${keyboard.brand_keyboard_slug}`"
                  :title="`${keyboard.brand?.name} ${keyboard.name}`"
                  reverse
                >
                  <NuxtImg
                    loading="lazy"
                    :alt="keyboard.name"
                    :src="keyboard.cover_image || '/keyboard.png'"
                    class="aspect-video w-full object-cover"
                  />
                </UPageCard>
              </UPageList>
            </template>
          </USlideover>

          <SharedProfileDrawer
            v-if="data.description"
            :title="data.name"
            :description="data.description"
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
      <UPageList v-if="sortedReleases.length" divide class="mt-4">
        <UPageCard
          v-for="(release, idx) in sortedReleases"
          :key="release.id"
          variant="ghost"
          :ui="{
            container: `!px-0 ${idx === 0 ? 'first:pt-0' : ''}`,
          }"
        >
          <UPageHeader
            :title="release.name"
            :description="release.description"
            :ui="{
              root: 'py-4 pt-0 border-none',
              title: 'text-base md:text-lg',
              description: 'text-sm',
            }"
          >
            <template v-if="editable" #links>
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
                      :keyboard="data"
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
                      :keyboard="data"
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

            <div v-if="getReleaseSpecs(release).length" class="mt-4">
              <SharedDescriptionList :items="getReleaseSpecs(release)" />
            </div>
          </UPageHeader>

          <UPageGrid
            v-if="release.variants?.length"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-6 gap-4"
          >
            <UModal
              v-for="variant in release.variants"
              :key="variant.id"
              :ui="{
                content: 'sm:max-w-3xl',
              }"
            >
              <UPageCard
                :title="variant.variant_name"
                reverse
                spotlight
                :ui="{
                  root: 'h-full cursor-pointer flex flex-col',
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
                  <div
                    class="flex items-center justify-between gap-2"
                    @click.stop
                  >
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
                        @click="setSelectedVariant(variant, release)"
                      />

                      <template #body="{ close }">
                        <KeyboardModalVariantForm
                          :is-edit="true"
                          :metadata="selectedVariant"
                          :keyboard="data"
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

              <template #content>
                <KeyboardVariantCard
                  :keyboard="{
                    ...variant,
                    release_name: release.name,
                    keyboard_name: data.name,
                    brand_name: data?.brand?.name,
                    layout: data?.layout,
                    typing_angle: data?.typing_angle,
                  }"
                  :authenticated="authenticated"
                  @save-to="saveToCollection"
                />
              </template>
            </UModal>
          </UPageGrid>
        </UPageCard>
      </UPageList>

      <SharedContributeSection
        v-else
        icon="hugeicons:keyboard"
        title="No Releases Yet"
        description="Please check back later or contribute by adding releases for this keyboard."
      />
    </template>
  </UDashboardPanel>
  <SharedRedirectPage v-else :to="`/keyboard/brand/${route.params.brand}`" />
</template>

<script setup>
import sortBy from 'lodash.sortby'

const colorMode = useColorMode()
const route = useRoute()
const userStore = useUserStore()
const { authenticated } = storeToRefs(userStore)

const slug = computed(() => `${route.params.brand}/${route.params.keyboard}`)

const editable = computed(() => userStore.isEditable(route.params.brand))

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
  () => `keyboard:${slug.value}`,
  () => $fetch(`/api/keyboards/${slug.value}`),
  {
    watch: [slug],
  },
)

const sortedReleases = computed(() => {
  const releases = sortBy(data.value?.releases || [], 'order')
  const [, direction = 'desc'] = String(sort.value || 'order|desc').split('|')

  return direction === 'asc' ? releases : releases.reverse()
})

const items = computed(() => {
  if (data.value.derived_from) {
    return [
      {
        label: 'Original Design',
        type: 'label',
      },
      {
        label: `${data.value.original.brand.name} ${data.value.original.name}`,
        icon: 'hugeicons:keyboard',
        to: `/keyboard/brand/${data.value.derived_from}`,
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
      to: `/keyboard/brand/${route.params.brand}`,
      avatar: {
        src: `/logo/${route.params.brand}.png`,
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
      label: data.value?.name,
    },
  ]
})

const keyboardLinks = computed(() => {
  const links = []

  if (data.value?.derived_from) {
    links.push({
      label: `${data.value.original.brand.name} ${data.value.original.name}`,
      icon: 'hugeicons:share-knowledge',
      to: `/keyboard/brand/${data.value.derived_from}`,
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

const setSelectedVariant = (variant, release = null) => {
  selectedVariant.value = {
    ...variant,
    release_name: release?.name || variant.release_name,
  }
}

const { addItem } = useCollectionItem()

const saveToCollection = (collection, variant) => {
  const contextName = formatKeyboardDescription([
    data.value?.name,
    variant.release_name,
    variant.variant_name,
  ])
  addItem(collection, { keyboard_item_id: variant.id }, contextName, 'Keyboard')
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
  return `${data.value?.brand?.name} ${data.value?.name}`
})

const description = computed(() => {
  if (data.value?.description) {
    return data.value.description
  }

  return `Explore ${data.value?.name} from ${data.value?.brand?.name} and discover its unique features, designs, and innovations in the world of mechanical keyboards.`
})

useSeoMeta({
  title: title.value,
  description: description.value,
  ogDescription: description.value,
  twitterDescription: description.value,
})

defineOgImage('Module', {
  title: data.value?.name,
  description: description.value,
  headline: data.value?.brand?.name,
  headlineLogo: `/logo/${data.value?.brand?.slug}.png`,
})
</script>
