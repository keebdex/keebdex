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
          v-for="{ id, keyboard } in sortedCollections"
          :key="id"
          :title="keyboard.variant_name"
          :description="
            formatKeyboardDescription([
              keyboard?.brand?.name,
              keyboard?.release?.keyboard?.name,
              keyboard?.release?.name,
            ])
          "
          variant="subtle"
          reverse
        >
          <NuxtImg
            loading="lazy"
            :alt="keyboard.variant_name"
            :src="keyboard.image_url || '/keyboard.png'"
            class="aspect-[16/9] w-full object-cover"
          />

          <template #footer>
            <UModal
              v-model:visible="visible.remove"
              title="Remove Keyboard"
              :description="`Are you sure you want to remove ${formatKeyboardDescription([keyboard?.brand?.name, keyboard?.release?.keyboard?.name, keyboard?.release?.name, keyboard?.variant_name])}?`"
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
                  label="Remove"
                  color="error"
                  @click="remove(id, keyboard)"
                />
              </template>
            </UModal>
          </template>
        </UPageCard>
      </UPageGrid>

      <UAlert
        v-else
        title="No keyboard variants yet"
        icon="hugeicons:keyboard"
        description="Save variants from keyboard pages to start building this collection."
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

watch(
  () => route.params.collection,
  () => refresh(),
)

const sortedCollections = computed(() => {
  return sortBy(data.value?.items || [], ['keyboard.variant_name'])
})

const remove = (id, keyboard) => {
  $fetch(
    `/api/users/${user.value.uid}/collections/${route.params.collection}/items/${id}`,
    { method: 'delete' },
  )
    .then(() => {
      refresh()
      const contextName = formatKeyboardDescription([
        keyboard?.brand?.name,
        keyboard?.release?.keyboard?.name,
        keyboard?.release?.name,
        keyboard?.variant_name,
      ])

      toast.add(handleSuccess('delete', contextName, 'Keyboard'))
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
