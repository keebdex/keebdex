<template>
  <UDashboardPanel id="keycap-color">
    <template #header>
      <UDashboardNavbar :title="meta.title">
        <template #right>
          <UModal v-model:visible="visible" title="Add Color">
            <UButton icon="hugeicons:color-picker"> Add </UButton>

            <template #body="{ close }">
              <ModalColorForm
                :is-edit="!!selectedColor?.id"
                :metadata="selectedColor"
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
      <!-- <UPageHeader v-bind="meta" /> -->

      <UTable sticky :data="data.colors" :columns="columns">
        <template #hex-cell="{ row }">
          <ColorSwatch :color="row.original.hex" />
        </template>

        <template #action-cell="{ row }">
          <div class="flex gap-2">
            <UModal v-model:visible="visible" title="Edit Color">
              <UButton
                label="Edit"
                icon="hugeicons:dashboard-circle-edit"
                size="sm"
                @click="setSelectedColor(row.original)"
              />

              <template #body="{ close }">
                <ModalColorForm
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

      <UPagination
        v-if="data.count > size"
        v-model:page="page"
        :items-per-page="size"
        :total="data.count"
        class="border-t border-default pt-4 mt-auto"
        :ui="{
          list: 'justify-center',
        }"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
const page = ref(1)
const size = ref(20)

const { data, refresh } = await useAsyncData(
  'colors',
  () =>
    $fetch('/api/colors', { query: { page: page.value, size: size.value } }),
  { watch: [page, size] },
)

const columns = [
  {
    accessorKey: 'system',
    header: 'System',
  },
  {
    accessorKey: 'code',
    header: 'Code',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'hex',
    header: 'Hex',
  },
  {
    id: 'action',
  },
]

const visible = ref(false)
const selectedColor = ref({})
const setSelectedColor = (color) => {
  selectedColor.value = color
}

const deleteColor = ref(false)
const confirmDelete = (color) => {
  $fetch(`/api/colors/${color.id}`, {
    method: 'delete',
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: `Color ${color.code} [${color.name}] was deleted.`,
      })
      refresh()
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}

const meta = {
  title: 'Keycap Colors',
  description:
    'Browse and explore official keycap color codes used in the mechanical keyboard community.',
}

useSeoMeta(meta)
defineOgImageComponent('Keycap', meta)
</script>
