<template>
  <UDashboardPanel :id="`collection-${route.params.collection}`">
    <template #header>
      <UDashboardNavbar :title="data.name">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal
            v-if="authenticated"
            v-model:visible="visible"
            title="Edit Collection"
          >
            <UButton icon="hugeicons:bookmark-03"> Edit </UButton>

            <template #body>
              <ModalCollectionForm
                :metadata="data"
                :uid="user.uid"
                :is-edit="true"
                @on-success="toggleShowEdit"
              />
            </template>
          </UModal>

          <UModal
            v-model:visible="removeCollection"
            title="Remove Collection"
            :description="`Are you sure you want to remove ${data?.name}?`"
            :ui="{ footer: 'justify-end' }"
          >
            <UButton
              v-if="user.email_verified"
              label="Delete"
              icon="hugeicons:bookmark-remove-02"
              color="error"
              @click="
                () => {
                  removeCollection = true
                }
              "
            />

            <template #footer="{ close }">
              <UButton label="Cancel" @click="close" />
              <UButton label="Remove" color="error" @click="deleteCollection" />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageColumns>
        <UPageCard
          v-for="{ keycap } in sortedCollections"
          :key="keycap.id"
          :title="keycap.name"
          :description="keycap.designer"
          variant="subtle"
          reverse
        >
          <NuxtImg
            loading="lazy"
            :alt="keycap.name"
            :src="keycap.img || keycap.render_img"
            class="h-full object-cover"
          />

          <template #footer>
            <UButton
              label="Remove"
              icon="hugeicons:delete-02"
              color="error"
              @click="remove(id, keycap)"
            />
          </template>
        </UPageCard>
      </UPageColumns>
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
  return sortBy(data.value?.items || [], ['keycap.name'])
})

const remove = (id, keycap) => {
  confirm.require({
    header: 'Confirm to remove keycap',
    message: `Are you sure you want to remove ${keycap.name}?`,
    rejectProps: {
      size: 'small',
      label: 'Cancel',
      severity: 'secondary',
    },
    acceptProps: {
      size: 'small',
      label: 'Remove',
      severity: 'danger',
    },
    accept: () => {
      $fetch(
        `/api/users/${user.value.uid}/collections/${route.params.collection}/items/${id}`,
        { method: 'delete' },
      )
        .then(() => {
          refresh()
          toast.add({
            color: 'success',
            title: `${keycap.name} was removed.`,
          })
        })
        .catch((error) => {
          toast.add({ color: 'error', title: error.message })
        })
    },
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
      toast.add({
        color: 'success',
        title: `Collection [${data.value.name}] was deleted.`,
      })
      router.go(-1)
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}

const visible = ref(false)
const toggleShowEdit = (shouldRefresh) => {
  visible.value = !visible.value
  if (shouldRefresh) {
    refresh()
  }
}

const removeCollection = ref(false)
</script>
