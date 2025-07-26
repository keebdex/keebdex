<template>
  <UDashboardPanel
    :id="`keycap-${profile}-${keycap}`"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <UDashboardNavbar title="Manage Kits">
        <template #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal v-model:visible="visible" title="Add Kit">
            <UButton
              icon="hugeicons:dashboard-square-add"
              @click="toggleEditKit()"
            >
              Add
            </UButton>

            <template #body>
              <ModalKeycapKitForm
                :is-edit="!!selectedKit?.id"
                :metadata="selectedKit"
                @on-success="toggleEditKit"
              />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UTable :data="data.kits" :columns="columns" class="flex-1">
        <template #status-cell="{ row }">
          <UBadge
            :label="row.original.cancelled ? 'Cancelled' : 'Active'"
            :color="row.original.cancelled ? 'error' : 'success'"
          />
        </template>
        <template #action-cell="{ row }">
          <div class="flex gap-2">
            <UButton
              label="Edit"
              icon="hugeicons:dashboard-square-edit"
              size="sm"
              @click="toggleEditKit(row.original)"
            />
            <UButton
              label="Delete"
              icon="hugeicons:dashboard-square-remove"
              size="sm"
              color="error"
              @click="confirmDelete(row.original)"
            />
          </div>
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const confirm = useConfirm()
const toast = useToast()

const route = useRoute()
const { profile, keycap } = route.params

const { data, refresh } = await useAsyncData(
  `keycap/${profile}/${keycap}`,
  () => $fetch(`/api/keycaps/${profile}/${keycap}`),
)

const breadcrumbs = computed(() => {
  return [
    {
      icon: 'hugeicons:home-01',
      to: '/',
    },
    {
      label: manufacturers[profile],
      to: `/keycap/${profile}`,
    },
    {
      label: data.value.name,
      to: `/keycap/${profile}/${keycap}`,
    },
    {
      label: 'Kits',
    },
  ]
})

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'price',
    header: 'Price',
  },
  {
    accessorKey: 'qty',
    header: 'Quantity',
  },
  {
    accessorKey: 'img',
    header: 'Image',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'action',
  },
]

useSeoMeta({
  title: data.value
    ? `${data.value.profile.name} ${data.value.name} - Manage Kits`
    : manufacturers[profile],
})

defineOgImageComponent('Keycap', {
  title: `${data.value.profile.name} ${data.value.name}`,
  description: 'Manage and update keycap kit details.',
  manufacturerId: profile,
})

const visible = ref(false)
const selectedKit = ref({})

const toggleEditKit = (kit, shouldRefresh) => {
  visible.value = !visible.value
  selectedKit.value = kit

  if (shouldRefresh) {
    refresh()
  }
}

const confirmDelete = (kit) => {
  confirm.require({
    header: `Confirm to delete ${kit.name} kit`,
    message: 'Are you sure you want to continue? This action cannot be undone.',
    rejectProps: {
      size: 'small',
      label: 'Cancel',
      severity: 'secondary',
    },
    acceptProps: {
      size: 'small',
      label: 'Delete',
      severity: 'danger',
    },
    accept: () => {
      $fetch(`/api/keycaps/${kit.profile_keycap_id}/kits/${kit.id}`, {
        method: 'delete',
      })
        .then(() => {
          toast.add({
            severity: 'success',
            summary: `Kit [${kit.name}] was deleted.`,
            life: 3000,
          })
          refresh()
        })
        .catch((error) => {
          toast.add({ severity: 'error', summary: error.message, life: 3000 })
        })
    },
  })
}
</script>
