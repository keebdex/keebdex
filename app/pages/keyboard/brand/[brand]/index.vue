<template>
  <UDashboardPanel v-if="data" :id="`keyboard-brand-${brand}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <!-- Add keeps its label; the other actions are icon-only, named by
             their tooltips and aria-labels -->
        <template #right>
          <UModal v-if="editable" title="Add Keyboard">
            <UButton
              color="primary"
              icon="hugeicons:dashboard-square-add"
              label="Add Keyboard"
            />

            <template #body="{ close }">
              <KeyboardModalKeyboardForm
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

          <SharedRecordActions
            :editable="editable"
            :suggestable="canSuggest(data)"
            :deletable="false"
            :ghost="false"
            label="Brand"
            @edit="editing = true"
            @suggest="suggest('keyboard_brand', data)"
            @history="history?.show()"
          />

          <SharedProfileDrawer
            :title="data.name"
            :slug="data.slug"
            :invertible="data.invertible_logo"
            :description="data.bio"
            :links="brandLinks"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <template v-if="editable">
        <SharedRevisionHistory
          ref="history"
          :button="false"
          domain="keyboard"
          :parent-key="brand"
          description="Every change to this brand, newest first. Its keyboards keep their own history."
          @reverted="refresh()"
        />

        <UModal v-model:open="editing" title="Edit Brand">
          <template #body>
            <KeyboardModalBrandForm
              :metadata="data"
              :is-edit="true"
              @on-success="
                () => {
                  editing = false
                  refresh()
                }
              "
            />
          </template>
        </UModal>
      </template>

      <UPageGrid v-if="data.keyboards?.length">
        <UPageCard
          v-for="keyboard in data.keyboards"
          :key="keyboard.slug"
          :to="`/keyboard/brand/${brand}/${keyboard.slug}`"
          :title="keyboard.name"
          :description="keyboard.description"
          reverse
          spotlight
          :ui="{
            root: 'h-full flex flex-col',
            container: imageCardContainerClass,
            description: 'line-clamp-3',
          }"
        >
          <NuxtImg
            preset="cover"
            loading="lazy"
            decoding="async"
            :alt="keyboard.name"
            :src="keyboard.cover_image || '/keyboard.png'"
            class="aspect-video w-full object-cover"
          />
        </UPageCard>
      </UPageGrid>

      <UEmpty
        v-else
        icon="hugeicons:keyboard"
        title="This Lineup Is Still Blank"
        description="Know one of their boards? Submit it and our staff will review it before it goes public."
        :actions="[
          {
            label: 'Add Keyboard',
            icon: 'hugeicons:add-square',
            to: { path: '/keyboard/submissions/submit', query: { brand } },
          },
        ]"
      />

      <SharedSuggestEditModal
        v-if="suggestTarget"
        v-model:open="suggestOpen"
        :entity-type="suggestTarget.entityType"
        :record="suggestTarget.record"
        :form-props="suggestTarget.formProps"
      />
    </template>
  </UDashboardPanel>
  <SharedRedirectPage v-else to="/keyboard/brand" />
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()

const brand = computed(() => String(route.params.brand || ''))

const editable = computed(() => userStore.isEditable(brand.value))

const {
  target: suggestTarget,
  open: suggestOpen,
  canSuggest,
  suggest,
} = useSuggestEdit(editable)

const editing = ref(false)
const history = useTemplateRef('history')

const { data, refresh } = await useAsyncData(
  () => `keyboard-brand:${brand.value}`,
  () => $fetch(`/api/keyboards/brands/${brand.value}`),
  {
    watch: [brand],
  },
)

const breadcrumbs = computed(() => {
  return [
    {
      label: 'Brands',
      icon: 'hugeicons:user-multiple',
      to: '/keyboard/brand',
    },
    {
      label: data.value?.name,
    },
  ]
})

const description = computed(() => {
  if (data.value?.bio) {
    return data.value.bio
  }

  return `Explore keyboards from ${data.value?.name} and discover their unique features, designs, and innovations in the world of mechanical keyboards.`
})

const brandLinks = computed(() => {
  const items = []

  if (data.value?.website) {
    items.push({
      label: 'Website',
      icon: 'hugeicons:globe-02',
      to: data.value.website,
      target: '_blank',
    })
  }

  if (data.value?.instagram) {
    items.push({
      label: 'Instagram',
      icon: 'hugeicons:instagram',
      to: data.value.instagram,
      target: '_blank',
    })
  }

  if (data.value?.discord) {
    items.push({
      label: 'Discord',
      icon: 'hugeicons:discord',
      to: data.value.discord,
      target: '_blank',
    })
  }

  return items
})

useSeoMeta({
  title: computed(() => data.value?.name || 'Keyboard Brands'),
  description: description.value,
  ogDescription: description.value,
  twitterDescription: description.value,
})

defineOgImage('Module', {
  title: data.value?.name,
  description: description.value,
  titleLogo: logoUrl(data.value?.slug),
})
</script>
