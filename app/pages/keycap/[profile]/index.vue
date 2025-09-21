<template>
  <UDashboardPanel id="keycap-sets">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #right>
          <UTabs
            v-if="!data.profile && $device.isDesktop"
            v-model="status"
            :items="
              selectStatuses.map((item) => ({ label: item, value: item }))
            "
          />

          <UModal v-model:visible="visible" title="Add Keycap">
            <UButton v-if="isAdmin" color="primary" icon="hugeicons:keyboard">
              Add
            </UButton>

            <template #body="{ close }">
              <ModalKeycapForm
                :metadata="query"
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

      <UDashboardToolbar v-if="$device.isMobile && !data.profile">
        <USelect
          v-model="status"
          :items="selectStatuses.map((item) => ({ label: item, value: item }))"
          class="w-full"
        />
      </UDashboardToolbar>
      <UDashboardToolbar v-if="$device.isTablet && !data.profile">
        <UTabs
          v-model="status"
          :items="selectStatuses.map((item) => ({ label: item, value: item }))"
          :content="false"
          class="w-full"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageHeader
        v-if="data.profile && data.profile.description"
        :title="title"
      >
        <template v-if="data.profile.description" #description>
          <PageHeaderDescription :description="data.profile.description" />
        </template>
      </UPageHeader>

      <UPageColumns v-if="data.keycaps.length">
        <UPageCard
          v-for="keycap in data.keycaps"
          :key="keycap.id"
          v-bind="keycap"
          :to="`/keycap/${keycap.profile_keycap_id}`"
          :title="keycap.name"
          reverse
          spotlight
        >
          <NuxtImg
            loading="lazy"
            :alt="keycap.name"
            :src="keycap.img || keycap.render_img"
            class="w-full h-full object-cover"
          />

          <template #footer>
            <SaveToCollection
              v-if="authenticated"
              :item="keycap"
              category="keycap"
              label="Save"
              class="z-10"
              @on-select="saveTo"
            />
          </template>
        </UPageCard>
      </UPageColumns>
      <UError
        v-else
        :error="{
          statusCode: 404,
          statusMessage: 'Not Found',
          message:
            'Currently, there are no keycaps available. Check back soon for fresh additions!',
        }"
      />

      <UPagination
        v-if="data.count > size"
        v-model:page="page"
        :items-per-page="size"
        :total="data.count"
        class="border-t border-default pt-4 mt-auto"
        :ui="{
          list: 'justify-center',
        }"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
const userStore = useUserStore()
const { authenticated, isAdmin, user } = storeToRefs(userStore)
const toast = useToast()

const route = useRoute()
const { profile } = route.params

const page = ref(1)
const size = ref(36)

const selectStatuses = computed(() => {
  return isAdmin.value
    ? ['Interest Check', 'Scheduled', 'Live', 'In Production', 'Review']
    : ['Interest Check', 'Scheduled', 'Live', 'In Production']
})

const status = ref(selectStatuses.value[0])

const query = computed(() => {
  return {
    page: page.value,
    size: size.value,
    profile_id: manufacturers[profile] && profile,
    status: manufacturers[profile] ? undefined : status.value,
  }
})

const { data, refresh } = await useAsyncData(
  route.path,
  () => $fetch('/api/keycaps', { query: query.value }),
  {
    watch: [page, size, status],
  },
)

const title = manufacturers[profile] ? manufacturers[profile] : 'Sets by Status'
const description = computed(() => {
  if (route.path === '/keycap/tracker') {
    return 'Discover new keycap sets in various stages: Interest Check, Live, and In Production.'
  }

  return data.value?.profile?.description
})

useSeoMeta({
  title,
  description,
  ogDescription: description,
  twitterDescription: description,
})

defineOgImage({
  component: profile === 'tracker' ? 'Website' : 'Keycap',
  props: {
    manufacturerId: profile,
  },
})

const visible = ref(false)

const saveTo = (collection, keycap) => {
  const item = {
    uid: user.value.uid,
    collection_id: collection.id,
    keycap_item_id: keycap.profile_keycap_id,
  }

  $fetch(`/api/users/${user.value.uid}/collections/${collection.id}/items`, {
    method: 'post',
    body: item,
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: `${keycap.name} has been added to [${collection.name}].`,
      })
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}
</script>
