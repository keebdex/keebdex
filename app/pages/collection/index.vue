<!-- eslint-disable vue/no-multiple-template-root -->
<template>
  <UDashboardPanel v-if="authenticated" id="collection">
    <template #header>
      <UDashboardNavbar title="My Collections">
        <template #right>
          <UTabs
            v-if="$device.isDesktopOrTablet"
            v-model="category"
            :items="categories"
            :content="false"
          />

          <UModal v-model:visible="visible" title="Add Collection">
            <UButton
              v-if="authenticated"
              color="primary"
              icon="hugeicons:bookmark-add-01"
            >
              Add
            </UButton>

            <template #body="{ close }">
              <ModalCollectionForm :uid="user.uid" @on-success="close" />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="$device.isMobile">
        <UTabs
          v-model="category"
          :items="categories"
          :content="false"
          class="w-full"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageGrid>
        <UPageCard
          v-for="collection in selectedCollections"
          v-bind="collection"
          :key="collection.id"
          :to="`/collection/${collection.category}/${collection.id}`"
          :title="collection.name"
          :description="`${collection.total_items} items`"
          :icon="
            collection.published ? 'hugeicons:face-id' : 'hugeicons:locked'
          "
          variant="subtle"
          :ui="{
            leadingIcon: !collection.published && 'text-dimmed',
          }"
        />
      </UPageGrid>
    </template>
  </UDashboardPanel>
  <UPageSection
    v-else
    v-bind="meta"
    icon="hugeicons:collections-bookmark"
    class="mx-auto"
  >
    <template v-if="!authenticated" #links>
      <UButton icon="hugeicons:login-03" @click="login = true">
        Sign In to Continue
      </UButton>
    </template>
  </UPageSection>

  <UModal v-model:open="login">
    <template #content>
      <UPageCard>
        <ModalLogin />
      </UPageCard>
    </template>
  </UModal>
</template>

<script setup>
const meta = {
  title: 'My Collection',
  description:
    'Manage and showcase your personal keycap and artisan collection in one place.',
}

useSeoMeta(meta)

const userStore = useUserStore()
const { authenticated, user, collections } = storeToRefs(userStore)

onBeforeMount(() => {
  userStore.fetchUserCollections(user.value.uid)
})

const login = ref(false)
const visible = ref(false)

const category = ref('artisan')
const categories = ref([
  { label: 'Artisan', value: 'artisan' },
  { label: 'Keycap', value: 'keycap' },
])

const selectedCollections = computed(() =>
  collections.value.filter((c) => c.category === category.value),
)
</script>
