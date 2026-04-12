<template>
  <UDashboardPanel :id="`collection-${route.params.collection}`">
    <template #header>
      <UDashboardNavbar :title="data?.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="authenticated"
            v-model:visible="visible.edit"
            title="Edit Collection"
          >
            <UButton icon="hugeicons:bookmark-02" label="Edit" />

            <template #body="{ close }">
              <CollectionModalCollectionForm
                :metadata="data"
                :uid="user.uid"
                :is-edit="true"
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>

          <UModal
            v-model:visible="visible.delete"
            title="Delete Collection"
            :description="`Are you sure you want to delete ${data?.name}?`"
            :ui="{ footer: 'justify-end', content: 'divide-none' }"
          >
            <UButton
              v-if="user.email_verified"
              label="Delete"
              icon="hugeicons:bookmark-remove-02"
              color="error"
            />

            <template #footer="{ close }">
              <UButton label="Cancel" @click="close" />
              <UButton label="Delete" color="error" @click="deleteCollection" />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid
        v-if="sortedCollections.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-6 gap-4"
      >
        <UPageCard
          v-for="{ id, keyset } in sortedCollections"
          :key="keyset.id"
          :title="keyset.name"
          :description="keyset.designer"
          variant="subtle"
          reverse
        >
          <NuxtImg
            loading="lazy"
            :alt="keyset.name"
            :src="keyset.img || keyset.render_img"
            class="aspect-[16/9] w-full object-cover"
          />

          <template #footer>
            <UModal
              v-model:visible="visible.remove"
              title="Remove Keyset"
              :description="`Are you sure you want to remove ${keyset.name}?`"
              :ui="{ footer: 'justify-end', content: 'divide-none' }"
            >
              <UButton
                label="Remove"
                icon="hugeicons:bookmark-minus-02"
                color="error"
              />

              <template #footer="{ close }">
                <UButton label="Cancel" @click="close" />
                <UButton
                  label="Delete"
                  color="error"
                  @click="remove(id, keyset)"
                />
              </template>
            </UModal>
          </template>
        </UPageCard>
      </UPageGrid>

      <UPageSection
        v-else
        icon="hugeicons:grid-view"
        title="No Keysets Yet"
        description="Save keysets from their respective pages to start building this collection."
        class="mx-auto"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
import sortBy from 'lodash.sortby'

const breadcrumbs = computed(() => {
  return [
    {
      label: 'My Collection',
      icon: 'hugeicons:collections-bookmark',
      to: '/collection',
    },
    {
      label: data.value?.name,
    },
  ]
})

const userStore = useUserStore()
const { authenticated, collections, user } = storeToRefs(userStore)

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { data, refresh } = await useAsyncData(() =>
  $fetch(`/api/collections/${route.params.collection}`),
)

useSeoMeta({
  title: data.value?.name ? `${data.value.name} • Collection` : 'Collection',
})

watchEffect(() => route.params.collection, refresh())

const sortedCollections = computed(() => {
  return sortBy(data.value?.items || [], ['keyset.name'])
})

const remove = (id, keyset) => {
  $fetch(
    `/api/users/${user.value.uid}/collections/${route.params.collection}/items/${id}`,
    { method: 'delete' },
  )
    .then(() => {
      refresh()
      toast.add(handleSuccess('delete', keyset?.name))
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}

const deleteCollection = () => {
  $fetch(`/api/users/${data.value.uid}/collections/${data.value.id}`, {
    method: 'delete',
  })
    .then(() => {
      collections.value = collections.value.filter(
        (c) => c.id !== data.value.id,
      )
      userStore.$patch({ collections: collections.value })
      toast.add(handleSuccess('delete', data.value?.name, 'Collection'))
      router.go(-1)
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}

const visible = ref({
  edit: false,
  delete: false,
  remove: false,
})
</script>
