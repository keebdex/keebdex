<template>
  <SharedRedirectPage v-if="!isAdmin" to="/account/settings" />

  <UDashboardPanel v-else id="admin-feedbacks">
    <template #header>
      <UDashboardNavbar title="Feedback Management" />
    </template>

    <template #body>
      <UPageCard
        variant="subtle"
        class="space-y-4 mx-auto min-w-0 w-full lg:max-w-6xl"
        :ui="{ container: 'min-w-0', wrapper: 'min-w-0' }"
      >
        <template #header>
          Review community feedback, resolve entries, and promote worthy
          messages to shoutouts.
        </template>

        <div class="flex justify-end px-4 py-3.5 border-b border-accented">
          <USelect
            v-model="resolvedFilter"
            :items="resolvedFilterOptions"
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
          <template #id-cell="{ row }">
            <div class="cursor-pointer" @click="toggleExpand(row.original.id)">
              #{{ row.original.id }}
            </div>
          </template>

          <template #name-cell="{ row }">
            <div
              class="font-medium truncate cursor-pointer"
              @click="toggleExpand(row.original.id)"
            >
              {{ authorName(row.original) }}
            </div>
          </template>

          <template #email-cell="{ row }">
            <div
              class="truncate cursor-pointer"
              @click="toggleExpand(row.original.id)"
            >
              {{ authorEmail(row.original) }}
            </div>
          </template>

          <template #message-cell="{ row }">
            <div
              class="cursor-pointer max-w-xl"
              @click="toggleExpand(row.original.id)"
            >
              <p
                class="text-sm"
                :class="
                  isExpanded(row.original.id)
                    ? 'whitespace-pre-wrap'
                    : 'line-clamp-1 truncate'
                "
              >
                {{ row.original.message || '-' }}
              </p>
              <p
                v-if="
                  isExpanded(row.original.id) && row.original.resolution_note
                "
                class="mt-2 text-sm text-muted border-s-2 border-success/50 ps-2 whitespace-pre-wrap"
              >
                {{ row.original.resolution_note }}
              </p>
            </div>
          </template>

          <template #action-cell="{ row }">
            <div class="flex flex-wrap items-center gap-2">
              <template v-if="!row.original.resolved">
                <UButton
                  label="Resolve"
                  size="xs"
                  color="primary"
                  icon="hugeicons:checkmark-circle-02"
                  :disabled="resolvingId !== null"
                  @click="openResolve(row.original)"
                />
              </template>

              <UButton
                v-if="!row.original.resolved"
                label="To Shoutout"
                size="xs"
                icon="hugeicons:quote-up"
                :loading="movingId === row.original.id"
                @click="moveToTestimonial(row.original)"
              />
            </div>
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

      <SharedNoteModal
        v-model:open="resolveOpen"
        v-model:note="resolveNote"
        title="Resolve Feedback"
        :description="
          resolveTarget?.submitted_by
            ? `${authorName(resolveTarget)} gets a notification, with your comment if you add one.`
            : 'This feedback was sent by a guest, so nobody is notified; a comment is only saved with it.'
        "
        :confirm-label="resolveNote.trim() ? 'Resolve with Comment' : 'Resolve'"
        label="Comment"
        help="Optional. Add one when there is something to tell them."
        placeholder="e.g. Thanks! This is fixed in the latest release."
        optional
        :loading="resolvingId !== null"
        @confirm="confirmResolve"
      />

      <UModal v-model:open="editorOpen" :title="editorTitle">
        <template #body="{ close }">
          <ModalShoutoutForm
            :metadata="shoutoutDraft"
            @on-success="
              async () => {
                await completeFeedbackMove()
                close()
                editorOpen = false
                clearSelectedFeedback()
              }
            "
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { resolutionNoteSchema } from '~/utils/schemas/common'

const userStore = useUserStore()
const { isAdmin } = storeToRefs(userStore)
const toast = useToast()

const columns = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'message',
    header: 'Message',
  },
  {
    id: 'action',
  },
]

const resolvedFilter = ref(false)
const resolvedFilterOptions = [
  {
    label: 'Unresolved',
    value: false,
  },
  {
    label: 'Resolved',
    value: true,
  },
]

const { page, size, setPage, resetPage } = usePagination(10)
const term = ref('')

const { data, status, refresh } = useAdvancedSearch('/api/admin/feedbacks', {
  key: 'admin-feedbacks',
  term,
  minLength: 0,
  pagination: {
    page,
    size,
  },
  filters: {
    resolved: resolvedFilter,
  },
})

const expandedId = ref(null)
const resolvingId = ref(null)
const movingId = ref(null)
const editorOpen = ref(false)
const selectedFeedback = ref(null)

const isExpanded = (id) => expandedId.value === id

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

watch(resolvedFilter, () => {
  expandedId.value = null
  resetPage()
})

const editorTitle = computed(() => 'Create Shoutout')

const shoutoutDraft = computed(() => ({
  name: selectedFeedback.value?.name || 'Anonymous',
  content: selectedFeedback.value?.message || '',
  role: '',
  avatar_url: '',
  status: 'Approved',
  featured: false,
}))

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

// Signed-in authors' name and email come from their profile.
const authorName = (feedback) =>
  feedback.submitter?.full_name || feedback.name || 'Anonymous'

const authorEmail = (feedback) =>
  feedback.submitter?.email || feedback.email || '-'

// Resolving notifies a signed-in author (database trigger), with the
// comment when there is one.
const resolve = async (feedback, note) => {
  resolvingId.value = feedback.id

  try {
    await $fetch(`/api/admin/feedbacks/${feedback.id}`, {
      method: 'post',
      body: { resolved: true, note },
    })

    toast.add(successToast('update', { entity: 'Feedback status' }))
    resolveTarget.value = null
    await refresh()
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    resolvingId.value = null
  }
}

// Resolve opens a dialog with an optional comment.
const resolveTarget = ref(null)
const resolveNote = ref('')
const resolveOpen = computed({
  get: () => !!resolveTarget.value,
  set: (value) => {
    if (!value && resolvingId.value === null) resolveTarget.value = null
  },
})

const openResolve = (feedback) => {
  resolveNote.value = ''
  resolveTarget.value = feedback
}

const confirmResolve = () => {
  if (!resolveNote.value.trim()) return resolve(resolveTarget.value)

  const result = resolutionNoteSchema.safeParse(resolveNote.value)

  if (!result.success) {
    toast.add(validationToast(result.error.issues[0]?.message))
    return
  }

  resolve(resolveTarget.value, result.data)
}

const clearSelectedFeedback = () => {
  selectedFeedback.value = null
}

const moveToTestimonial = async (feedback) => {
  selectedFeedback.value = feedback
  editorOpen.value = true
}

const completeFeedbackMove = async () => {
  if (!selectedFeedback.value?.id) {
    return
  }

  movingId.value = selectedFeedback.value.id

  try {
    await $fetch(`/api/admin/feedbacks/${selectedFeedback.value.id}`, {
      method: 'post',
      body: {
        resolved: true,
      },
    })

    await refresh()
  } catch (error) {
    toast.add(errorToast(error))
    throw error
  } finally {
    movingId.value = null
  }
}

useSeoMeta({
  title: 'Feedback Management',
})

definePageMeta({
  middleware: 'admin',
})
</script>
