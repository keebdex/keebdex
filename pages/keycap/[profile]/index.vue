<template>
  <!-- <div
    v-if="data.keycaps.length"
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
  >
    <nuxt-link
      v-for="keycap in data.keycaps"
      :key="keycap.id"
      :to="`/keycap/${keycap.profile_keycap_id}`"
    >
      <Card
        class="h-full overflow-hidden"
        pt:header:class="h-48 md:h-60"
        pt:body:class="flex-1"
        pt:caption:class="flex-grow"
        pt:subtitle:class="flex justify-between gap-2"
      >
        <template #header>
          <img
            loading="lazy"
            :alt="keycap.name"
            :src="keycap.img || keycap.render_img"
            class="w-full h-full object-cover"
          />
        </template>

        <template v-if="keycap.profile" #title>
          {{ keycap.profile.name }} {{ keycap.name }}
        </template>
        <template v-else #title>{{ keycap.name }}</template>

        <template #subtitle>
          <span class="flex items-center gap-1">
            <i class="pi pi-palette" />
            {{ keycap.designer }}
          </span>
          <span
            v-if="query.status === 'Interest Check'"
            class="flex items-center gap-1"
          >
            <i class="pi pi-clock" /> {{ formatDate(keycap.ic_date) }}
          </span>
          <span
            v-else-if="query.status === 'Live'"
            class="flex items-center gap-1"
          >
            <i class="pi pi-clock" />
            {{ formatDateRange(keycap.start_date, keycap.end_date) }}
          </span>
          <span v-else class="flex items-center gap-1">
            <i class="pi pi-clock" />
            {{ formatDateRange(keycap.start_date, keycap.end_date) }}
          </span>
        </template>
      </Card>
    </nuxt-link>
  </div> -->

  <UDashboardPanel id="keycap-tracker" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #right>
          <UTabs
            v-if="!data.profile"
            v-model="status"
            :items="
              selectStatuses.map((item) => ({ label: item, value: item }))
            "
            :content="false"
          />

          <UModal v-model:visible="visible" title="Add Keycap">
            <UButton v-if="isAdmin" color="primary" icon="hugeicons:keyboard">
              Add
            </UButton>

            <template #body>
              <ModalKeycapForm :metadata="query" @on-success="showAddKeycap" />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHeader
        v-if="data.profile && data.profile.description"
        :description="data.profile.description"
        :ui="{
          root: 'pt-0',
          description: 'text-md',
        }"
      />

      <UPageColumns v-if="data.keycaps.length">
        <UPageCard
          v-for="keycap in data.keycaps"
          :key="keycap.id"
          v-bind="keycap"
          :to="`/keycap/${keycap.profile_keycap_id}`"
          :title="keycap.name"
          variant="subtle"
          reverse
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
      <UPagination v-model:page="page" :total="data.count" />
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
const size = ref(16)

const selectStatuses = ['Interest Check', 'Live', 'In Production']
const status = ref(selectStatuses[0])

const query = computed(() => {
  return {
    page: page.value,
    size: size.value,
    profile_id: manufacturers[profile] && profile,
    status: manufacturers[profile] ? undefined : status.value,
  }
})

const { data, refresh } = await useAsyncData(
  () => $fetch('/api/keycaps', { query: query.value }),
  {
    watch: [page, size, status],
  },
)

const title = manufacturers[profile] ? manufacturers[profile] : 'Keycap Tracker'
const description = computed(() => {
  if (route.path === '/keycap/tracker') {
    return 'Discover new keycap sets in various stages: Interest Check, Live, and In Production.'
  }

  return data.value?.profile.description
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
const showAddKeycap = (shouldRefresh) => {
  visible.value = !visible.value
  if (shouldRefresh) {
    refresh()
  }
}

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
        severity: 'success',
        summary: `${keycap.name} has been added to [${collection.name}].`,
        life: 3000,
      })
    })
    .catch((error) => {
      toast.add({ severity: 'error', summary: error.message, life: 3000 })
    })
}
</script>
