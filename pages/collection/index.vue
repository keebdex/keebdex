<template>
  <Panel
    header="My Collections"
    pt:root:class="!border-0 !bg-transparent"
    pt:title:class="flex items-center gap-4 font-medium text-3xl"
    pt:header-actions:class="flex gap-2"
  >
    <template #icons>
      <SelectButton
        v-model="category"
        :options="categories"
        option-label="label"
        option-value="value"
      />

      <Button
        v-if="authenticated"
        icon="pi pi-folder-plus"
        label="Add"
        @click="toggleAddCollection"
      />
    </template>

    <Dialog
      v-model:visible="visible"
      modal
      header="Add Collection"
      class="w-[36rem]"
      dismissable-mask
    >
      <ModalCollectionForm :uid="user.uid" @on-success="toggleAddCollection" />
    </Dialog>

    <DataView
      :value="selectedCollections"
      layout="grid"
      paginator
      :rows="60"
      :total-records="selectedCollections.length"
      :always-show-paginator="false"
      :pt="{
        content: '!bg-transparent',
        pcPaginator: {
          paginatorContainer: '!border-0 pt-4',
          root: '!bg-transparent',
        },
      }"
    >
      <template #empty>
        <div class="flex flex-col items-center gap-8">
          <NuxtImg class="w-1/3" src="/svg/empty.svg" alt="Empty" />

          <div class="text-2xl">
            It looks like your selection didn't yield any collections.
          </div>
        </div>
      </template>

      <template #grid="{ items }">
        <div
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
        >
          <nuxt-link
            v-for="collection in items"
            :key="collection.id"
            :to="`/collection/${collection.category}/${collection.id}`"
          >
            <Card
              class="h-full"
              pt:title:class="flex items-center justify-between"
            >
              <template #title>
                {{ collection.name }}

                <Message
                  size="small"
                  variant="simple"
                  severity="secondary"
                  :icon="collection.published ? 'pi pi-globe' : 'pi pi-lock'"
                />
              </template>
              <template v-if="authenticated" #subtitle>
                {{ collection.total_items }} items
              </template>
            </Card>
          </nuxt-link>
        </div>
      </template>
    </DataView>
  </Panel>
</template>

<script setup>
useSeoMeta({
  title: 'My Collections',
})

definePageMeta({
  middleware: 'auth',
})

const userStore = useUserStore()
const { authenticated, user, collections } = storeToRefs(userStore)

onBeforeMount(() => {
  userStore.fetchUserCollections(user.value.uid)
})

const visible = ref(false)
const toggleAddCollection = () => {
  visible.value = !visible.value
}

const category = ref('artisan')
const categories = ref([
  { label: 'Artisan', value: 'artisan' },
  { label: 'Keycap', value: 'keycap' },
])

const selectedCollections = computed(() =>
  collections.value.filter((c) => c.category === category.value),
)
</script>
