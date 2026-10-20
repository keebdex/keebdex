<template>
  <USlideover
    v-model:open="open"
    :title="detail ? detailTitle : 'History'"
    :description="detail ? detailDescription : description"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <UButton icon="hugeicons:time-quarter-pass" label="History" />

    <template #body>
      <!-- One revision: what it changed, or how it compares with now -->
      <div v-if="selectedId" class="space-y-4">
        <UButton
          icon="hugeicons:arrow-left-02"
          label="All Changes"
          variant="link"
          color="neutral"
          class="px-0"
          :ui="{ label: 'block' }"
          @click="selectedId = null"
        />

        <div v-if="detailLoading && !detail" class="space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
        </div>

        <template v-else-if="detail">
          <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
            <UAvatar
              v-if="detail.actor_avatar"
              :src="detail.actor_avatar"
              :alt="detail.actor_name || undefined"
              size="2xs"
            />
            <UIcon v-else :name="revisionIcon(detail)" class="size-4" />
            <span>{{ revisionAuthor(detail) }}</span>
            <span>·</span>
            <time :datetime="detail.created_at">
              {{ formatDate(detail.created_at) }}
            </time>
            <UButton
              v-if="detail.suggestion_id"
              label="View Suggestion"
              :to="`/${detail.domain}/submissions?view=edits&status=Approved`"
              variant="link"
              size="sm"
              class="px-0"
              :ui="{ label: 'block' }"
            />
          </div>

          <UAlert
            v-if="!detail.current"
            icon="hugeicons:alert-02"
            color="warning"
            variant="subtle"
            title="Record Deleted"
            description="This record no longer exists, so its revisions can only be viewed."
          />

          <UAlert
            v-else-if="view === 'change' && conflicts.length"
            icon="hugeicons:alert-02"
            color="warning"
            variant="subtle"
            title="Edited Again"
            :description="`${fieldList(conflicts)} changed again after this revision, so it can no longer be undone. Restore the revision instead to bring the whole record back to it.`"
          />

          <UTabs
            v-model="view"
            :items="viewItems"
            :content="false"
            size="sm"
            class="w-full"
          />

          <SharedRevisionDiff
            v-if="view === 'change'"
            :diffs="changeDiffs"
            :before-values="detail.before || {}"
            :after-values="detail.snapshot"
            :highlight="conflicts"
            empty="This revision changed no fields that can be shown."
          />

          <SharedRevisionDiff
            v-else
            :diffs="currentDiffs"
            :labels="['Current', 'This Revision']"
            :before-values="detail.current || {}"
            :after-values="detail.snapshot"
            empty="The record still matches this revision."
          />
        </template>
      </div>

      <!-- All revisions of the page -->
      <template v-else>
        <div v-if="loading && !revisions.length" class="space-y-3">
          <USkeleton v-for="i in 5" :key="i" class="h-16 w-full" />
        </div>

        <UEmpty
          v-else-if="!revisions.length"
          icon="hugeicons:time-quarter-pass"
          title="No Changes Yet"
          description="Changes to this page and its records will be listed here as they happen."
        />

        <div v-else class="space-y-4">
          <SharedRevisionList :entries="entries" @select="select" />

          <div v-if="hasMore" class="flex justify-center">
            <UButton
              label="Load Older"
              variant="soft"
              :loading="loading"
              :ui="{ label: 'block' }"
              @click="load(true)"
            />
          </div>
        </div>
      </template>
    </template>

    <template v-if="detail?.current" #footer>
      <div class="flex flex-wrap justify-end gap-2 w-full">
        <UButton
          v-if="detail.action === 'update'"
          label="Undo"
          icon="hugeicons:undo-02"
          :disabled="!undoFields.length || !!conflicts.length"
          @click="confirm('undo')"
        />
        <UButton
          label="Restore"
          icon="hugeicons:arrow-turn-backward"
          color="primary"
          :disabled="!restoreFields.length"
          @click="confirm('restore')"
        />
      </div>
    </template>
  </USlideover>

  <SharedConfirmModal
    v-model:open="confirmOpen"
    :title="confirmTitle"
    :description="confirmDescription"
    :confirm-label="confirmMode === 'undo' ? 'Undo' : 'Restore'"
    confirm-color="primary"
    :loading="reverting"
    @confirm="revert"
  />
</template>

<script setup lang="ts">
import type { Revision, RevisionDetail } from '~/utils/revisions'

// History button and slideover of a sculpt, keyset or keyboard page (staff
// only): the revisions of the record and its children, loaded when opened,
// with a diff per revision and Undo / Restore. Emits `reverted` so the page
// reloads its data.
const props = withDefaults(
  defineProps<{
    domain: 'artisan' | 'keyset' | 'keyboard'
    parentKey: string
    description?: string
  }>(),
  {
    description: 'Every change to this page and its records, newest first.',
  },
)

const emit = defineEmits<{ reverted: [] }>()

const toast = useToast()

const open = ref(false)
const revisions = ref<Revision[]>([])
const hasMore = ref(false)
const loading = ref(false)

const entries = computed(() => groupRevisions(revisions.value))

const load = async (older = false) => {
  loading.value = true

  try {
    const result = await $fetch<{ data: Revision[]; hasMore: boolean }>(
      '/api/revisions',
      {
        query: {
          domain: props.domain,
          parent_key: props.parentKey,
          before: older ? revisions.value.at(-1)?.id : undefined,
        },
      },
    )

    revisions.value = older ? [...revisions.value, ...result.data] : result.data
    hasMore.value = result.hasMore
  } catch (error) {
    toast.add(errorToast(error))
  } finally {
    loading.value = false
  }
}

watch(open, (value) => {
  if (value) {
    selectedId.value = null
    load()
  }
})

// Selected revision ------------------------------------------------------------

const selectedId = ref<number | null>(null)
const detail = ref<RevisionDetail | null>(null)
const detailLoading = ref(false)
const view = ref<'change' | 'current'>('change')

const loadDetail = async (id: number) => {
  detailLoading.value = true

  try {
    const result = await $fetch<RevisionDetail>(`/api/revisions/${id}`)

    if (selectedId.value === id) detail.value = result
  } catch (error) {
    toast.add(errorToast(error))
    selectedId.value = null
  } finally {
    detailLoading.value = false
  }
}

const select = (revision: Revision) => {
  detail.value = null
  view.value = 'change'
  selectedId.value = revision.id
  loadDetail(revision.id)
}

watch(selectedId, (id) => {
  if (!id) detail.value = null
})

const viewItems = computed(() => [
  { label: 'This Change', value: 'change' },
  {
    label: 'Compare with Current',
    value: 'current',
    disabled: !detail.value?.current,
  },
])

const detailTitle = computed(() =>
  detail.value
    ? detail.value.label || revisionEntityLabel(detail.value)
    : 'Revision',
)

const detailDescription = computed(() =>
  detail.value
    ? `${REVISION_ACTION_LABELS[detail.value.action]} ${revisionEntityLabel(detail.value).toLowerCase()}`
    : undefined,
)

const changeDiffs = computed(() =>
  detail.value ? revisionChangeDiff(detail.value) : [],
)
const currentDiffs = computed(() =>
  detail.value ? revisionCurrentDiff(detail.value) : [],
)
const undoFields = computed(() =>
  detail.value ? revertableFields(detail.value, 'undo') : [],
)
const restoreFields = computed(() =>
  detail.value ? revertableFields(detail.value, 'restore') : [],
)
const conflicts = computed(() =>
  detail.value?.current && detail.value.action === 'update'
    ? undoConflicts(detail.value)
    : [],
)

const fieldList = (keys: string[]) => {
  const labels = keys.map(suggestionFieldLabel)

  return labels.length > 1
    ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
    : labels[0] || ''
}

// Undo / Restore -------------------------------------------------------------------

const confirmOpen = ref(false)
const confirmMode = ref<'undo' | 'restore'>('undo')
const reverting = ref(false)

const confirm = (mode: 'undo' | 'restore') => {
  confirmMode.value = mode
  confirmOpen.value = true
}

const confirmTitle = computed(() =>
  confirmMode.value === 'undo' ? 'Undo This Change' : 'Restore This Revision',
)

const confirmDescription = computed(() => {
  if (!detail.value) return undefined

  const keys = (
    confirmMode.value === 'undo' ? undoFields.value : restoreFields.value
  ).map((diff) => diff.key)
  const locked = syncLockedFields(detail.value, keys)
  const action =
    confirmMode.value === 'undo'
      ? `${fieldList(keys)} will go back to the values before this change.`
      : `${fieldList(keys)} will go back to the values of this revision.`
  const warning = locked.length
    ? ` ${fieldList(locked)} will stop updating from the maker's ${
        detail.value.current?.source === 'scraper' ? 'website' : 'Google Doc'
      }.`
    : ''

  return `${action}${warning} The change is saved as a new revision, so it can be reverted too.`
})

const revert = async () => {
  if (!detail.value) return

  const revision = detail.value
  reverting.value = true

  try {
    await $fetch(`/api/revisions/${revision.id}/revert`, {
      method: 'POST',
      body: { mode: confirmMode.value },
    })

    toast.add(
      successToast('update', {
        entity: revisionEntityLabel(revision),
        name: revision.label,
      }),
    )
    confirmOpen.value = false
    emit('reverted')
    await Promise.all([load(), loadDetail(revision.id)])
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    reverting.value = false
  }
}
</script>
