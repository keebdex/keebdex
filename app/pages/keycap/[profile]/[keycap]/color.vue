<template>
  <UDashboardPanel :id="`keycap-${profile}-${keycap}-color`">
    <template #header>
      <UDashboardNavbar title="Manage Keycap Colors">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal v-model:visible="visible" title="Add Color">
            <UButton icon="hugeicons:dashboard-circle-add"> Add </UButton>

            <template #body="{ close }">
              <ModalKeycapColorForm
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
      <UPageHeader title="Manage Keycap Colors" :description="description" />

      <UTable :data="data.colors" :columns="columns" class="flex-1">
        <template #hex-cell="{ row }">
          <ColorSwatch :color="row.original.color?.hex" />
        </template>

        <template #action-cell="{ row }">
          <div class="flex gap-2">
            <UModal v-model:visible="visible" title="Edit Color">
              <template #body="{ close }">
                <ModalKeycapColorForm
                  :is-edit="true"
                  :metadata="selectedColor"
                  @on-success="
                    () => {
                      close()
                      setSelectedColor()
                      refresh()
                    }
                  "
                />
              </template>
            </UModal>

            <UModal
              v-model:visible="deleteColor"
              title="Remove Color"
              description="Are you sure you want to continue? This action cannot be undone."
              :ui="{ footer: 'justify-end', content: 'divide-none' }"
            >
              <UButton
                label="Delete"
                icon="hugeicons:dashboard-circle-remove"
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
      label: 'Colors',
    },
  ]
})

const columns = [
  {
    accessorKey: 'color.code',
    header: 'Code',
  },
  {
    accessorKey: 'color.name',
    header: 'Name',
  },
  {
    id: 'hex',
    accessorKey: 'color.hex',
    header: 'Color',
  },
  {
    id: 'action',
  },
]

const description =
  'Easily manage and connect official color codes to keycap sets on Keebdex.'
useSeoMeta({
  title: data.value
    ? `${data.value.profile.name} ${data.value.name} - Manage Keycap Colors`
    : manufacturers[profile],
  description,
})

defineOgImageComponent('Keycap', {
  title: `${data.value.profile.name} ${data.value.name}`,
  description,
  manufacturerId: profile,
})

const visible = ref(false)
const selectedColor = ref({})

const setSelectedColor = (color) => {
  selectedColor.value = color
}

const deleteColor = ref(false)
const confirmDelete = (color) => {
  $fetch(`/api/keycaps/${color.profile_keycap_id}/colors/${color.id}`, {
    method: 'delete',
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: `Color [${color.name}] was deleted.`,
      })
      refresh()
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}
</script>
