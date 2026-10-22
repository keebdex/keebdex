<template>
  <UButton
    v-if="button"
    icon="hugeicons:time-quarter-pass"
    label="History"
    @click="show()"
  />

  <USlideover
    v-model:open="open"
    :title="detail ? detailTitle : 'History'"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <!-- A revision's header says who made it and when -->
    <template #description>
      <span v-if="detail">
        <SharedRevisionAuthors :revisions="[detail]" />
        {{ revisionVerb(detail) }} ·
        <time
          :datetime="detail.created_at"
          :title="formatTimeAgo(detail.created_at)"
        >
          {{ dateTime.format(new Date(detail.created_at)) }}
        </time>
        <template v-if="detail.suggestion_id">
          ·
          <ULink
            :to="`/${detail.domain}/submissions?view=edits&status=Approved`"
            class="text-primary hover:underline"
          >
            View Suggestion
          </ULink>
        </template>
      </span>
      <template v-else-if="!selectedId">{{ listDescription }}</template>
    </template>

    <template #body>
      <!-- One revision: what it changed, or how it compares with now -->
      <div v-if="selectedId" class="space-y-4">
        <div v-if="detailLoading && !detail" class="space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
        </div>

        <template v-else-if="detail">
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

      <!-- All revisions of the page, or of one of its records -->
      <div v-else class="space-y-4">
        <div
          v-if="record"
          class="flex flex-wrap items-center justify-between gap-2"
        >
          <UBadge
            :label="record.label"
            icon="hugeicons:filter"
            variant="subtle"
            class="max-w-full"
            :ui="{ label: 'truncate' }"
          />
          <UButton
            label="Show All Changes"
            variant="link"
            size="sm"
            class="px-0"
            :ui="{ label: 'block' }"
            @click="show()"
          />
        </div>

        <div v-if="loading && !revisions.length" class="space-y-3">
          <USkeleton v-for="i in 5" :key="i" class="h-16 w-full" />
        </div>

        <UEmpty
          v-else-if="!revisions.length"
          icon="hugeicons:time-quarter-pass"
          title="No Changes Yet"
          :description="
            record
              ? 'Changes to this record will be listed here as they happen.'
              : 'Changes to this page and its records will be listed here as they happen.'
          "
        />

        <template v-else>
          <SharedRevisionList :revisions="revisions" @select="select" />

          <div v-if="hasMore" class="flex justify-center">
            <UButton
              label="Load Older"
              variant="soft"
              :loading="loading"
              :ui="{ label: 'block' }"
              @click="load(true)"
            />
          </div>
        </template>
      </div>
    </template>

    <!-- The list links to every page's changes; a revision has its actions -->
    <template v-if="!selectedId" #footer>
      <UButton
        label="Recent Changes"
        icon="hugeicons:time-quarter-pass"
        to="/recent-changes"
        trailing-icon="hugeicons:arrow-right-02"
        class="ms-auto"
        :ui="{ label: 'block' }"
      />
    </template>

    <!-- A revision: back to the list on the left, its actions on the right -->
    <template v-else #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          icon="hugeicons:arrow-left-02"
          label="All Changes"
          @click="selectedId = null"
        />

        <div v-if="detail?.current" class="flex flex-wrap gap-2">
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

import type { SuggestionEntityType } from '~/utils/suggestions'

interface RevisionRecord {
  entityType: SuggestionEntityType
  entityId: number
  label: string
}

// History button and slideover of a sculpt, keyset or keyboard page (staff
// only): the revisions of the record and its children, loaded when opened,
// with a diff per revision and Undo / Restore. `show({ record })` (exposed)
// narrows it to one child record, e.g. from a colorway card. `?history=1`
// opens it on load and `&rev=<id>` opens that revision (links from Recent
// Changes). Emits `reverted` with the fields the revert wrote, so the page
// reloads its data (or follows a sculpt's changed slug).
const props = withDefaults(
  defineProps<{
    domain: 'artisan' | 'keyset' | 'keyboard'
    parentKey: string
    description?: string
    // Render the History button; off when the page opens it through show().
    button?: boolean
  }>(),
  {
    description: 'Every change to this page and its records, newest first.',
    button: true,
  },
)

const emit = defineEmits<{
  reverted: [revert: { entityType: string; changes: Record<string, unknown> }]
}>()

const toast = useToast()
const route = useRoute()
const router = useRouter()

const open = ref(false)
const record = ref<RevisionRecord | null>(null)
const listDescription = computed(() => {
  if (record.value) {
    return `Every change to this ${SUGGESTION_ENTITIES[record.value.entityType].label.toLowerCase()}, newest first.`
  }

  return props.description
})
const revisions = ref<Revision[]>([])
const hasMore = ref(false)
const loading = ref(false)

const load = async (older = false) => {
  loading.value = true

  try {
    const result = await $fetch<{ data: Revision[]; hasMore: boolean }>(
      '/api/revisions',
      {
        query: {
          domain: props.domain,
          parent_key: props.parentKey,
          entity_type: record.value?.entityType,
          entity_id: record.value?.entityId,
          groups: 20,
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

// Revision to open once the slideover is open (deep link or show()).
const pendingRevision = ref<number | null>(null)

const start = () => {
  revisions.value = []
  hasMore.value = false
  selectedId.value = null

  if (pendingRevision.value) {
    selectRevision(pendingRevision.value)
    pendingRevision.value = null
  }

  load()
}

/** Opens the history, of the whole page or one record. */
const show = (
  options: { record?: RevisionRecord | null; revisionId?: number } = {},
) => {
  record.value = options.record ?? null
  pendingRevision.value = options.revisionId ?? null

  if (open.value) start()
  else open.value = true
}

watch(open, (value) => {
  if (value) {
    start()
  } else if (route.query.history) {
    // Closing drops the deep link, so a reload doesn't reopen it.
    const { history: _history, rev: _rev, ...query } = route.query
    router.replace({ query })
  }
})

onMounted(() => {
  if (!route.query.history) return

  const revisionId = Number(route.query.rev)

  show({
    revisionId:
      Number.isInteger(revisionId) && revisionId > 0 ? revisionId : undefined,
  })
})

defineExpose({ show })

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

const selectRevision = (id: number) => {
  detail.value = null
  view.value = 'change'
  selectedId.value = id
  loadDetail(id)
}

const select = (revision: Revision) => selectRevision(revision.id)

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

// When a revision was made, to the minute.
const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

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
    await Promise.all([load(), loadDetail(revision.id)])
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    reverting.value = false
  }
}
</script>
