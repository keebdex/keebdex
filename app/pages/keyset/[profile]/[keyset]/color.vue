<template>
  <UDashboardPanel :id="`keyset-${profile}-${keyset}-color`">
    <template #header>
      <UDashboardNavbar title="Manage Keyset Colors">
        <template v-if="$device.isDesktopOrTablet" #left>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #right>
          <UModal v-model:visible="visible" title="Add Keyset Color">
            <UButton
              icon="hugeicons:dashboard-circle-add"
              label="Add"
              color="primary"
            />

            <template #body="{ close }">
              <KeysetModalKeysetColorForm
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
      <UPageCard
        description="Please add the primary keyset colors (alpha and modifier) before proceeding to add any accent colors."
        variant="naked"
      />

      <UTable :data="data.colors" :columns="columns" class="flex-1">
        <template #code-cell="{ row }">
          {{ row.original.color.system }} {{ row.original.color.code }}
        </template>

        <template #hex-cell="{ row }">
          <KeysetColorSwatch :color="row.original.color?.hex" />
        </template>

        <template #action-cell="{ row }">
          <div class="flex gap-2">
            <UModal v-model:visible="visible" title="Edit Color">
              <template #body="{ close }">
                <KeysetModalKeysetColorForm
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
                  @click="
                    () => {
                      confirmDelete(row.original)
                      close()
                    }
                  "
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
const { profile, keyset } = route.params
const { manufacturers } = useKeysetProfiles()

const { data, refresh } = await useAsyncData(
  `keyset/${profile}/${keyset}`,
  () => $fetch(`/api/keysets/${profile}/${keyset}`),
)

const breadcrumbs = computed(() => {
  return [
    {
      label: manufacturers.value[profile],
      to: `/keyset/${profile}`,
    },
    {
      label: data.value.name,
      to: `/keyset/${profile}/${keyset}`,
    },
    {
      label: 'Colors',
    },
  ]
})

const columns = [
  {
    id: 'code',
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
    header: 'Hex',
  },
  {
    id: 'action',
  },
]

const description =
  'Easily manage and connect official color codes to keyset collections on Keebdex.'
useSeoMeta({
  title: data.value
    ? `${data.value.profile.name} ${data.value.name} - Manage Keyset Colors`
    : manufacturers.value[profile],
  description,
})

defineOgImage('Base', {
  title: `${data.value.profile.name} ${data.value.name}`,
  description,
})

const visible = ref(false)
const selectedColor = ref({})

const setSelectedColor = (color) => {
  selectedColor.value = color
}

const deleteColor = ref(false)
const confirmDelete = (color) => {
  $fetch(`/api/keysets/${color.profile_keyset_id}/colors/${color.id}`, {
    method: 'delete',
  })
    .then(() => {
      toast.add(
        handleSuccess(
          'delete',
          `${color.color?.system} ${color.color?.code}`,
          'Color',
        ),
      )

      refresh()
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
