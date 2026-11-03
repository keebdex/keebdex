<template>
  <!-- The revision: its record, who made it, and Undo / Restore -->
  <div class="flex w-full flex-wrap items-start justify-between gap-4">
    <div class="min-w-0 space-y-1">
      <USkeleton v-if="!detail" class="h-7 w-64" />
      <h2 v-else class="text-2xl font-semibold text-highlighted text-pretty">
        {{ detailTitle }}
      </h2>

      <p v-if="detail" class="text-sm text-muted">
        <SharedRevisionAuthors :revisions="[detail]" />
        {{ revisionVerb(detail) }} {{ entityLabel }} ·
        <time
          :datetime="detail.created_at"
          :title="formatTimeAgo(detail.created_at)"
        >
          {{ formatDateTime(detail.created_at) }}
        </time>
      </p>
    </div>

    <div v-if="detail?.current" class="flex flex-wrap gap-2">
      <UButton
        v-if="detail.action === 'update'"
        label="Undo"
        icon="hugeicons:undo-02"
        :disabled="!undoFields.length || !!conflicts.length"
        :ui="{ label: 'block' }"
        @click="confirm('undo')"
      />
      <UButton
        label="Restore Revision"
        icon="hugeicons:arrow-turn-backward"
        color="primary"
        variant="solid"
        :disabled="!restoreFields.length"
        :ui="{ label: 'block' }"
        @click="confirm('restore')"
      />
    </div>
  </div>

  <!-- What it changed, side by side or unified; the default slot leads the
       band, e.g. the change navigator of a Recent Changes entry. -->
  <div
    class="flex w-full flex-wrap items-center justify-between gap-3 rounded-md border border-default bg-elevated/50 px-4 py-3"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
      <slot />

      <span class="text-sm text-muted">
        <template v-if="detail">
          {{ countLabel(changeDiffs.length, 'field') }} changed
        </template>
      </span>
    </div>

    <UTabs
      v-model="layout"
      :items="layoutItems"
      :content="false"
      size="xs"
      aria-label="View mode"
    />
  </div>

  <div v-if="detailLoading && !detail" class="w-full space-y-3">
    <USkeleton v-for="i in 3" :key="i" class="h-28 w-full" />
  </div>

  <div v-else-if="detail" class="w-full space-y-4">
    <UAlert
      v-if="!detail.current"
      icon="hugeicons:alert-02"
      color="warning"
      variant="subtle"
      title="Record Deleted"
      description="This record no longer exists, so its revisions can only be viewed."
    />

    <UAlert
      v-else-if="conflicts.length"
      icon="hugeicons:alert-02"
      color="warning"
      variant="subtle"
      title="Edited Again"
      :description="`${revisionFieldList(conflicts)} changed again after this revision, so it can no longer be undone. Restore the revision instead to bring the whole record back to it.`"
    />

    <SharedRevisionDiff
      :diffs="changeDiffs"
      :layout="layout"
      :before-values="detail.before || {}"
      :after-values="detail.snapshot"
      :highlight="conflicts"
      empty="This revision changed no fields that can be shown."
    />
  </div>

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
import type { RevisionDetail, RevisionRevert } from '~/utils/revisions'

// One revision, as History and Recent Changes both show it, in a panel or
// slideover body (both lay their children out with a gap): its record with
// who made it and when, Undo and Restore Revision, a band led by the default
// slot (Recent Changes puts the entry's change navigator there) with how many
// fields changed and the view mode (side by side or unified), and the field diff
// against the record before it. Undo and Restore go through a confirmation
// that names the fields they write. Emits `loaded` with the revision, and
// `reverted` with the fields a revert wrote, after which it reloads.
const props = defineProps<{ revisionId: number }>()

const emit = defineEmits<{
  loaded: [detail: RevisionDetail | null]
  reverted: [revert: RevisionRevert]
}>()

const toast = useToast()

const detail = ref<RevisionDetail | null>(null)
const detailLoading = ref(false)

const loadDetail = async (id: number) => {
  detailLoading.value = true

  try {
    const result = await $fetch<RevisionDetail>(`/api/revisions/${id}`)

    // A revision selected meanwhile wins.
    if (props.revisionId === id) detail.value = result
  } catch (error) {
    toast.add(errorToast(error))
  } finally {
    detailLoading.value = false
  }
}

watch(
  () => props.revisionId,
  (id) => {
    detail.value = null
    loadDetail(id)
  },
  { immediate: true },
)
watch(detail, (value) => emit('loaded', value))

const detailTitle = computed(() =>
  detail.value ? detail.value.label || revisionEntityLabel(detail.value) : '',
)

const entityLabel = computed(() =>
  detail.value ? `this ${revisionEntityLabel(detail.value).toLowerCase()}` : '',
)

const changeDiffs = computed(() =>
  detail.value ? revisionChangeDiff(detail.value) : [],
)
const undoFields = computed(() =>
  detail.value ? revertableFields(detail.value, changeDiffs.value) : [],
)
const restoreFields = computed(() =>
  detail.value
    ? revertableFields(detail.value, revisionCurrentDiff(detail.value))
    : [],
)
const conflicts = computed(() =>
  detail.value?.current && detail.value.action === 'update'
    ? undoConflicts(detail.value, undoFields.value)
    : [],
)

// Shared by every revision opened in this session.
const layout = useState<'split' | 'unified'>(
  'revision-diff-layout',
  () => 'split',
)

const layoutItems = [
  { label: 'Side by Side', value: 'split', icon: 'hugeicons:layout-2-column' },
  { label: 'Unified', value: 'unified', icon: 'hugeicons:layout-2-row' },
]

// Undo / Restore -------------------------------------------------------------

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
      ? `${revisionFieldList(keys)} will go back to the values before this change.`
      : `${revisionFieldList(keys)} will go back to the values of this revision.`
  const warning = locked.length
    ? ` ${revisionFieldList(locked)} will stop updating from the maker's ${
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
    const { changes } = await $fetch<{ changes: Record<string, unknown> }>(
      `/api/revisions/${revision.id}/revert`,
      {
        method: 'POST',
        body: { mode: confirmMode.value },
      },
    )

    toast.add(
      successToast('update', {
        entity: revisionEntityLabel(revision),
        name: revision.label,
      }),
    )
    confirmOpen.value = false
    emit('reverted', { entityType: revision.entity_type, changes })
    await loadDetail(revision.id)
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    reverting.value = false
  }
}
</script>
