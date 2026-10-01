<template>
  <UDashboardPanel id="artisan-submissions">
    <template #header>
      <UDashboardNavbar title="Colorway Submissions">
        <template #right>
          <UButton
            label="Submit a Colorway"
            icon="hugeicons:plus-sign"
            to="/artisan/submissions/submit"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageCard
        variant="subtle"
        class="space-y-4 mx-auto min-w-0 w-full lg:max-w-6xl"
        :ui="{ container: 'min-w-0', wrapper: 'min-w-0' }"
      >
        <template #header>
          {{ pageDescription }}
        </template>

        <div class="flex justify-end px-4 py-3.5 border-b border-accented">
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            class="w-full sm:w-52"
          />
        </div>

        <UTable
          sticky
          :loading="status === 'pending'"
          :data="data.data"
          :columns="columns"
          class="min-w-0 max-w-full"
        >
          <template #img-cell="{ row }">
            <NuxtImg
              v-if="row.original.img"
              :src="row.original.img"
              :alt="row.original.name"
              class="size-12 rounded object-cover"
            />
          </template>

          <template #name-cell="{ row }">
            <div class="font-medium truncate max-w-48">
              {{ row.original.name }}
            </div>
          </template>

          <template #maker-cell="{ row }">
            <div class="truncate max-w-48">
              {{ row.original.maker?.name || row.original.maker_id }} /
              {{ row.original.sculpt?.name || row.original.sculpt_id }}
            </div>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="row.original.status"
              variant="subtle"
              :color="statusColorMap[row.original.status] || 'neutral'"
            />
          </template>

          <template #created_at-cell="{ row }">
            {{ formatDate(row.original.created_at) }}
          </template>

          <template #action-cell="{ row }">
            <UButton
              label="Review"
              size="xs"
              variant="soft"
              icon="hugeicons:file-edit"
              @click="editSubmission(row.original)"
            />
          </template>
        </UTable>

        <div
          class="border-t border-default pt-4 mt-auto px-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-toned text-sm text-center sm:text-left">
            Showing {{ paginationMeta.from }} to {{ paginationMeta.to }} of
            <span class="font-semibold text-highlighted">{{
              paginationMeta.total
            }}</span>
          </p>

          <UPagination
            v-if="data.count > size"
            :page="page"
            :items-per-page="size"
            :total="data.count"
            :ui="{
              list: 'flex-wrap justify-center sm:justify-end',
            }"
            @update:page="setPage"
          />
        </div>
      </UPageCard>

      <UModal v-model:open="editorOpen" :title="editorTitle">
        <template #body="{ close }">
          <ArtisanModalSubmissionWizard
            v-if="selectedSubmission"
            mode="review"
            :submission="selectedSubmission"
            @on-success="() => onEditSuccess(close)"
            @on-delete="() => onDeleteSuccess(close)"
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const userStore = useUserStore()
const { isModerator } = storeToRefs(userStore)

const pageDescription = computed(() =>
  isModerator.value
    ? 'Review colorways submitted by the community and approve, reject, or edit them before they become official records.'
    : "Track the colorways you've submitted. You can edit or delete a submission while it's pending review, and delete a rejected submission.",
)

const columns = [
  { accessorKey: 'img', header: 'Image' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'maker', header: 'Maker / Sculpt' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Submitted' },
  { id: 'action' },
]

const statusFilter = ref('Pending')

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const { page, size, setPage, resetPage } = usePagination(10)
const { data, status, refresh } = useAdvancedSearch(
  '/api/submissions/artisan',
  {
    key: 'artisan-submissions',
    term: ref(''),
    minLength: 0,
    pagination: {
      page,
      size,
    },
    filters: {
      status: statusFilter,
    },
  },
)

watch(statusFilter, resetPage)

const paginationMeta = computed(() => {
  const total = data.value?.count || 0
  const visibleOnPage = data.value?.data?.length || 0

  if (!total || !visibleOnPage) {
    return {
      total,
      from: 0,
      to: 0,
    }
  }

  const from = (page.value - 1) * size + 1
  const to = from + visibleOnPage - 1

  return {
    total,
    from,
    to,
  }
})

const editorOpen = ref(false)
const selectedSubmission = ref(null)

const editorTitle = 'Review Colorway'

const editSubmission = (colorway) => {
  selectedSubmission.value = colorway
  editorOpen.value = true
}

const onEditSuccess = async (close) => {
  await refresh()
  close()
  editorOpen.value = false
  selectedSubmission.value = null
}

const onDeleteSuccess = async (close) => {
  await refresh()
  close()
  editorOpen.value = false
  selectedSubmission.value = null
}
</script>
