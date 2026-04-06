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
      <UAlert
        title="Keyboard Collection"
        icon="hugeicons:keyboard"
        description="Keyboard collections are enabled. Item-level keyboard saving will appear here once keyboard collection items are available."
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
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

watch(
  () => route.params.collection,
  () => refresh(),
)

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
})
</script>
