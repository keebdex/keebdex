<template>
  <UDashboardPanel id="keyset-submissions">
    <template #header>
      <UDashboardNavbar title="Keyset Submissions">
        <template #right>
          <UButton
            label="Submit a Keyset"
            icon="hugeicons:plus-sign"
            to="/keyset/submissions/submit"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-4 h-full">
        <div class="space-y-3">
          <USelect
            v-model="statusFilter"
            :items="statusOptions"
            class="w-full"
          />

          <div class="space-y-2">
            <UPageCard
              v-for="row in data.data"
              :key="row.id"
              :title="row.name"
              :description="`${row.profile?.name || row.profile_id} • ${row.kits_count} kit(s)`"
              spotlight
              reverse
              class="cursor-pointer"
              :class="selectedId === row.id ? 'ring-2 ring-primary' : ''"
              :ui="{
                root: 'h-full',
                container: 'py-3 gap-3',
                title: 'text-sm truncate',
                description: 'text-xs truncate',
              }"
              @click="selectSubmission(row)"
            >
              <div class="flex items-center gap-3">
                <NuxtImg
                  v-if="row.img"
                  :src="row.img"
                  :alt="row.name"
                  class="size-12 rounded object-cover shrink-0"
                />
                <div v-else class="size-12 rounded bg-elevated shrink-0" />

                <div class="min-w-0">
                  <p class="text-xs text-dimmed truncate">
                    {{
                      isModerator
                        ? row.submitter?.full_name || row.submitter?.email
                        : formatDate(row.created_at)
                    }}
                  </p>
                  <UBadge
                    :label="row.review_status"
                    variant="subtle"
                    size="xs"
                    :color="statusColorMap[row.review_status] || 'neutral'"
                  />
                </div>
              </div>
            </UPageCard>

            <p
              v-if="!data.data.length"
              class="text-sm text-dimmed text-center py-8"
            >
              No {{ statusFilter.toLowerCase() }} submissions.
            </p>
          </div>

          <UPagination
            v-if="data.count > size"
            :page="page"
            :items-per-page="size"
            :total="data.count"
            :ui="{ list: 'flex-wrap justify-center' }"
            @update:page="setPage"
          />
        </div>

        <UPageCard variant="subtle" class="min-w-0">
          <template v-if="detail">
            <KeysetModalKeysetSubmissionForm
              :key="detail.id"
              :metadata="detail"
              @on-success="onDetailSuccess"
              @on-delete="onDetailDelete"
            />
          </template>

          <div
            v-else
            class="flex flex-col items-center justify-center gap-2 py-16 text-center text-dimmed"
          >
            <UIcon name="hugeicons:cursor-pointer-01" class="size-8" />
            <p class="text-sm">Select a submission to review its details.</p>
          </div>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const userStore = useUserStore()
const { isModerator } = storeToRefs(userStore)

const statusFilter = ref('Pending')

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const { page, size, setPage, resetPage } = usePagination(10)
const { data, refresh } = useAdvancedSearch('/api/submissions/keyset', {
  key: 'keyset-submissions',
  term: ref(''),
  minLength: 0,
  pagination: { page, size },
  filters: { status: statusFilter },
})

watch(statusFilter, () => {
  resetPage()
  selectedId.value = null
  detail.value = null
})

const selectedId = ref(null)
const detail = ref(null)

const selectSubmission = async (row) => {
  selectedId.value = row.id
  detail.value = await $fetch(`/api/submissions/keyset/${row.id}`)
}

const onDetailSuccess = async () => {
  await refresh()

  if (selectedId.value) {
    detail.value = await $fetch(`/api/submissions/keyset/${selectedId.value}`)
  }
}

const onDetailDelete = async () => {
  selectedId.value = null
  detail.value = null
  await refresh()
}
</script>
