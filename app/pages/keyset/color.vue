<template>
  <UDashboardPanel id="keyset-color">
    <template #header>
      <UDashboardNavbar :title="meta.title">
        <template v-if="editable" #right>
          <UModal v-model:visible="visible" title="Add Color">
            <UButton
              icon="hugeicons:color-picker"
              label="Add"
              color="primary"
            />

            <template #body="{ close }">
              <KeysetModalColorForm
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

          <KeysetModalColorImportForm @on-success="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        class="flex flex-col gap-2 px-4 py-3.5 border-b border-accented sm:flex-row"
      >
        <USelect
          v-model="system"
          :items="systemFilters"
          class="w-full sm:w-56"
        />

        <UInput
          v-model="term"
          icon="hugeicons:filter"
          placeholder="What's your hue?"
          class="w-full"
        />
      </div>

      <UTable
        sticky
        :loading="status === 'pending'"
        :data="data.data"
        :columns="columns"
      >
        <template #hex-cell="{ row }">
          <KeysetColorSwatch :color="row.original.hex" />
        </template>

        <template v-if="editable" #action-cell="{ row }">
          <div class="flex gap-2">
            <UModal
              v-model:visible="visible"
              title="Edit Color"
              @after:leave="setSelectedColor"
            >
              <UButton
                label="Edit"
                icon="hugeicons:dashboard-circle-edit"
                size="sm"
                @click="setSelectedColor(row.original)"
              />

              <template #body="{ close }">
                <KeysetModalColorForm
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
              v-if="isAdmin"
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
        :page="page"
        :items-per-page="size"
        :total="data.count"
        class="border-t border-default pt-4 mt-auto"
        :ui="{
          list: 'justify-center',
        }"
        @update:page="setPage"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { Constants } from '~/types/database.types'

const userStore = useUserStore()
const { isAdmin } = storeToRefs(userStore)
const editable = computed(() => userStore.isEditable())
const toast = useToast()

const { page, size, setPage, resetPage } = usePagination(10)

const term = ref('')
const system = ref('all')
const systemFilters = [
  { label: 'All Matching Systems', value: 'all' },
  ...Constants.public.Enums.keyset_color_matching_system.map((s) => ({
    label: s,
    value: s,
  })),
]

const { data, status, refresh } = useAdvancedSearch('/api/colors', {
  key: 'keyset-colors',
  term,
  minLength: 0,
  pagination: {
    page,
    size,
  },
  filters: {
    system: computed(() => (system.value !== 'all' ? system.value : undefined)),
  },
})

watch([term, system], resetPage)

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
    header: 'Color',
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
      toast.add(handleSuccess('delete', color.name))

      refresh()
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}

const meta = {
  title: 'Color Swatches',
  description:
    'Explore the vibrant world of keycap colors! Browse our extensive collection of color swatches, from classic hues to unique shades.',
}

useSeoMeta(meta)
</script>
