<template>
  <UDashboardPanel v-if="data" :id="`keyboard-brand-${brand}`">
    <template #header>
      <UDashboardNavbar :title="breadcrumbs.at(-1).label">
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

          <UModal
            v-if="Object.hasOwn(pinnedBrands, brand)"
            title="Customize Pins"
            description="Pin keyboards to keep them at the top of the list."
          >
            <UTooltip text="Customize Pins">
              <UButton icon="hugeicons:pin" aria-label="Customize Pins" />
            </UTooltip>

            <template #body="{ close }">
              <SharedPinForm
                :items="keyboards.all"
                value-key="slug"
                :selected="keyboards.pinned.map((keyboard) => keyboard.slug)"
                :save="
                  (ids) => userStore.savePinnedChildren('keyboard', brand, ids)
                "
                @on-success="close"
              />
            </template>
          </UModal>
        </template>
      </SharedOwnerHero>

      <!-- Pinned keyboards get a group of their own above the rest; without
           pins the grid follows the hero directly -->
      <section
        v-for="(group, index) in keyboards.groups"
        :key="group.label"
        :class="['space-y-3', index ? 'pt-8' : 'pt-4']"
      >
        <SharedPinGroupLabel
          v-if="keyboards.pinned.length"
          :pinned="group.pinned"
        >
          {{ group.label }}
        </SharedPinGroupLabel>

        <UPageGrid>
          <SharedCatalogCard
            v-for="keyboard in group.items"
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
      </section>

      <section v-if="!keyboards.all.length" class="pt-4">
        <UEmpty
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
const { authenticated, pinnedBrands } = storeToRefs(userStore)

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

const { data, refresh, error } = await useAsyncData(
  () => `keyboard-brand:${brand.value}`,
  () => $fetch(`/api/keyboards/brands/${brand.value}`),
  {
    watch: [brand],
  },
)

throwIfNotFound(error.value)

const favKeyboards = computed(() => pinnedBrands.value[brand.value] || [])
const isPinned = (keyboard) => favKeyboards.value.includes(keyboard.slug)
const keyboards = computed(() =>
  splitPinned(data.value?.keyboards || [], isPinned),
)

// The trail ends at the parent page (shown, not marked current): the page
// header names this one
const breadcrumbs = computed(() => {
  return [
    {
      label: 'Brands',
      icon: 'hugeicons:user-multiple',
      to: '/keyboard/brand',
      active: false,
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
  description,
})

defineOgImage('Module', {
  title: data.value?.name,
  description: description.value,
  titleLogo: logoUrl(data.value?.slug),
})
</script>
