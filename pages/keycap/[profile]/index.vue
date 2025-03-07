<template>
  <Panel
    :header="title"
    pt:root:class="!border-0 !bg-transparent"
    pt:title:class="flex items-center gap-4 font-medium text-3xl"
  >
    <template #icons>
      <Button
        v-if="isAdmin"
        label="Add"
        icon="pi pi-file-plus"
        @click="showAddKeycap"
      />
    </template>

    <SelectButton
      v-if="!data.profile"
      v-model="status"
      :options="selectStatuses"
      class="mb-6"
    />

    <div
      v-if="data.profile && data.profile.description"
      class="mb-6 leading-6 text-muted-color"
    >
      <p
        v-for="(line, idx) in data.profile.description.split('\n')"
        :key="idx"
        class="mb-2"
      >
        {{ line }}
      </p>
    </div>

    <div
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

          <template v-if="authenticated" #footer>
            <SaveToCollection
              :item="keycap"
              category="keycap"
              label="Save"
              :fluid="true"
              @on-select="saveTo"
            />
          </template>
        </Card>
      </nuxt-link>
    </div>
    <div v-else class="flex flex-col h-full items-center gap-8">
      <NuxtImg class="w-1/3" src="/svg/search.svg" alt="Empty" />

      <div class="text-2xl">
        Currently, there are no keycaps available. Check back soon for fresh
        additions!
      </div>
    </div>

    <Paginator
      class="mt-4"
      :rows="size"
      :total-records="data.count"
      :always-show="false"
      pt:root:class="!bg-transparent"
      @page="(e) => (page = e.page + 1)"
    />

    <Dialog
      v-model:visible="visible"
      modal
      header="Add Keycap"
      dismissable-mask
      class="w-[36rem]"
    >
      <ModalKeycapForm :metadata="query" @on-success="showAddKeycap" />
    </Dialog>
  </Panel>
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
