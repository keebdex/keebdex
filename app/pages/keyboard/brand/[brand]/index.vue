<template>
  <UDashboardPanel v-if="data" :id="`keyboard-brand-${brand}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <SharedOwnerHero
        :title="data.name"
        :slug="data.slug"
        :invertible="data.invertible_logo"
        :description="data.bio"
        :links="brandLinks"
        details-label="Brand Details"
      >
        <template v-if="authenticated" #actions>
          <UButton
            color="primary"
            icon="hugeicons:dashboard-square-add"
            label="Add Keyboard"
            v-bind="addKeyboardTarget"
          />

          <SharedRecordActions
            :editable="editable"
            :suggestable="canSuggest(data)"
            label="Brand"
            @edit="editing = true"
            @suggest="suggest('keyboard_brand', data)"
            @history="history?.show()"
          />
        </template>
      </SharedOwnerHero>

      <section class="pt-4">
        <UPageGrid v-if="data.keyboards?.length">
          <SharedCatalogCard
            v-for="keyboard in data.keyboards"
            :key="keyboard.slug"
            :title="keyboard.name"
            :description="keyboard.description"
            :img="keyboard.cover_image"
            fallback="/keyboard.png"
            :to="`/keyboard/brand/${brand}/${keyboard.slug}`"
          >
            <template v-if="keyboard.form_factor" #badges>
              <UBadge
                :label="keyboard.form_factor"
                variant="solid"
                class="absolute top-2 left-2"
              />
            </template>
          </SharedCatalogCard>
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
              ui: { label: 'block' },
              ...addKeyboardTarget,
            },
          ]"
        />
      </section>

      <template v-if="editable">
        <SharedRevisionHistory
          ref="history"
          domain="keyboard"
          :parent-key="brand"
          description="Every change to this brand, newest first. Its keyboards keep their own history."
          @reverted="refresh()"
        />

        <UModal v-model:open="addingKeyboard" title="Add Keyboard">
          <template #body>
            <KeyboardModalKeyboardForm
              :brand-slug="brand"
              @on-success="
                () => {
                  addingKeyboard = false
                  refresh()
                }
              "
            />
          </template>
        </UModal>

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
const { authenticated } = storeToRefs(userStore)

const brand = computed(() => String(route.params.brand || ''))

const editable = computed(() => userStore.isEditable(brand.value))

const {
  target: suggestTarget,
  open: suggestOpen,
  canSuggest,
  suggest,
} = useSuggestEdit(editable)

const editing = ref(false)
const addingKeyboard = ref(false)
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

// Staff add a keyboard in place; everyone else goes to the submission wizard
const addKeyboardTarget = computed(() =>
  submissionTarget(
    editable.value,
    () => (addingKeyboard.value = true),
    'keyboard',
    { brand: brand.value },
  ),
)

const description = computed(() => {
  if (data.value?.bio) {
    return data.value.bio
  }

  return `Explore keyboards from ${data.value?.name} and discover their unique features, designs, and innovations in the world of mechanical keyboards.`
})

const brandLinks = computed(() => ownerLinks(data.value))

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
