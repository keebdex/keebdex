<template>
  <UDashboardPanel :id="`keycap-${profile}-${keycap}`">
    <template #header>
      <UDashboardNavbar title="Manage Keycap Kits">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal v-model:visible="visible" title="Add Kit">
            <UButton icon="hugeicons:dashboard-square-add"> Add </UButton>

            <template #body="{ close }">
              <ModalKeycapKitForm
                :is-edit="!!selectedKit?.id"
                :metadata="selectedKit"
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
    </template>

    <template #body>
      <UPageHeader title="Manage Keycap Kits" :description="description" />

      <UTable :data="data.kits" :columns="columns" class="flex-1">
        <template #status-cell="{ row }">
          <UBadge
            :label="row.original.cancelled ? 'Cancelled' : 'Active'"
            :color="row.original.cancelled ? 'error' : 'success'"
          />
        </template>
        <template #action-cell="{ row }">
          <div class="flex gap-2">
            <UModal v-model:visible="visible" title="Edit Kit">
              <UButton
                label="Edit"
                icon="hugeicons:dashboard-square-edit"
                size="sm"
                @click="setSelectedKit(row.original)"
              />

              <template #body="{ close }">
                <ModalKeycapKitForm
                  :is-edit="true"
                  :metadata="selectedKit"
                  @on-success="
                    () => {
                      close()
                      setSelectedKit()
                      refresh()
                    }
                  "
                />
              </template>
            </UModal>

            <UModal
              v-model:visible="deleteKit"
              title="Remove Kit"
              description="Are you sure you want to continue? This action cannot be undone."
              :ui="{ footer: 'justify-end', content: 'divide-none' }"
            >
              <UButton
                label="Delete"
                icon="hugeicons:dashboard-square-remove"
                size="sm"
                color="error"
              />

              <template #footer="{ close }">
                <UButton label="Cancel" @click="close" />
                <UButton
                  label="Remove"
                  color="error"
                  @click="confirmDelete(row.original)"
                />
              </template>
            </UModal>
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

const description =
  'Organize and edit keycap kits with ease. Add, update, or remove kits to keep your collection accurate and up to date.'

useSeoMeta({
  title: data.value
    ? `${data.value.profile.name} ${data.value.name} - Manage Keycap Kits`
    : manufacturers[profile],
  description,
})

defineOgImageComponent('Keycap', {
  title: `${data.value.profile.name} ${data.value.name}`,
  description: description,
  manufacturerId: profile,
})

const visible = ref(false)
const selectedKit = ref({})

const setSelectedKit = (kit) => {
  selectedKit.value = kit
}

const deleteKit = ref(false)
const confirmDelete = (kit) => {
  $fetch(`/api/keycaps/${kit.profile_keycap_id}/kits/${kit.id}`, {
    method: 'delete',
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: `Kit [${kit.name}] was deleted.`,
      })
      refresh()
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}
</script>
