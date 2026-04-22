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
          />

          <KeyboardRelatedKeyboardsDrawer
            v-if="data.derived_keyboards?.length"
            :keyboards="data.derived_keyboards"
            title="Derived Designs"
            description="A collection of keyboards that share this design's DNA through community reworks, official collaborations, and specialized iterations."
            button-label="Derived"
            icon="hugeicons:archive-02"
          />

          <SharedProfileDrawer
            v-if="data.description"
            :title="data.name"
            :description="data.description"
          />

          <KeyboardRelatedKeyboardsDrawer
            v-if="data.derived_from && data.original"
            :keyboards="[data.original]"
            title="Original Design"
            description="This is the original design that inspired this keyboard's creation."
            button-label="Original"
            icon="hugeicons:copyright"
          />

          <UDropdownMenu v-else-if="items.length" :items="items">
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
                    label="Edit"
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

                <UModal
                  v-if="
                    editable && (!release.variants || !release.variants.length)
                  "
                  v-model:visible="visible.deleteRelease"
                  title="Delete Release"
                  :description="`Are you sure you want to delete release '${release.name}'? This action cannot be undone.`"
                  :ui="{ footer: 'justify-end', content: 'divide-none' }"
                >
                  <UButton
                    label="Delete"
                    icon="hugeicons:file-remove"
                    color="error"
                    @click="
                      () => {
                        setSelectedRelease(release)
                        visible.deleteRelease = true
                      }
                    "
                  />
                  <template #footer="{ close }">
                    <UButton label="Cancel" @click="close" />
                    <UButton
                      label="Delete"
                      color="error"
                      @click="() => deleteRelease(release, close)"
                    />
                  </template>
                </UModal>
              </div>
            </template>

            <div v-if="!release.variant_specs" class="mt-4">
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
                  :src="
                    variant.img_front || variant.img_back || '/keyboard.png'
                  "
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
                    <UModal
                      v-if="editable"
                      v-model:visible="visible.deleteVariant"
                      title="Delete Variant"
                      :description="`Are you sure you want to delete variant '${variant.variant_name}'? This action cannot be undone.`"
                      :ui="{ footer: 'justify-end', content: 'divide-none' }"
                    >
                      <UButton
                        label="Delete"
                        icon="hugeicons:file-remove"
                        color="error"
                        @click="
                          () => {
                            setSelectedVariant(variant, release)
                            visible.deleteVariant = true
                          }
                        "
                      />
                      <template #footer="{ close }">
                        <UButton label="Cancel" @click="close" />
                        <UButton
                          label="Delete"
                          color="error"
                          @click="() => deleteVariant(variant, close)"
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
                  :release="release"
                  :authenticated="authenticated"
                  @save-to="saveToCollection"
                />
              </template>
            </UModal>

            <UModal v-if="editable" title="Add Variant">
              <template #default="{ open }">
                <UButton
                  label="Add Variant"
                  icon="hugeicons:add-square"
                  variant="outline"
                  class="w-full justify-center ring-0 border border-default border-dashed rounded-lg"
                  @click="open"
                />
              </template>
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
const toast = useToast()

const slug = computed(() => `${route.params.brand}/${route.params.keyboard}`)

const editable = computed(() => userStore.isEditable(route.params.brand))

const visible = ref({
  addRelease: false,
  editKeyboard: false,
  deleteVariant: false,
  deleteRelease: false,
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

const deleteVariant = async (variant, close) => {
  try {
    await $fetch(
      `/api/keyboards/${variant.brand_keyboard_slug}/variants/${variant.id}`,
      { method: 'delete' },
    )

    toast.add(handleSuccess('delete', variant.variant_name, 'Variant'))

    if (typeof close === 'function') close()
    refresh()
  } catch (error) {
    toast.add(handleError(error))
  } finally {
    visible.value.deleteVariant = false
    clearSelectedVariant()
  }
}

const deleteRelease = async (release, close) => {
  try {
    await $fetch(
      `/api/keyboards/${release.brand_keyboard_slug}/releases/${release.id}`,
      { method: 'delete' },
    )

    toast.add(handleSuccess('delete', release.name, 'Release'))

    if (typeof close === 'function') close()
    refresh()
  } catch (error) {
    toast.add(handleError(error))
  } finally {
    visible.value.deleteRelease = false
    clearSelectedRelease()
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
  const items = [
    {
      term: 'Release Year',
      description: release?.release_year,
    },
    {
      term: 'Mount',
      description: release?.mount_style,
    },
    {
      term: 'Typing Angle',
      description: release?.typing_angle ? `${release.typing_angle}°` : null,
    },
  ]

  if (!release?.variant_specs) {
    items.push(
      {
        term: 'Pricing',
        description: release?.msrp_price
          ? formatPrice(release.msrp_price, release.currency)
          : null,
      },
      {
        term: 'Case',
        description: release?.case_materials?.length
          ? release.case_materials.join(', ')
          : null,
      },
      {
        term: 'PCB',
        description: release?.pcb_types?.length
          ? release.pcb_types.join(', ')
          : null,
      },
      {
        term: 'Plate',
        description: release?.plate_materials?.length
          ? release.plate_materials.join(', ')
          : null,
      },
      {
        term: 'Weight',
        description: release?.weight_materials?.length
          ? release.weight_materials.join(', ')
          : null,
      },
    )
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
