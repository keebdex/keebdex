<template>
  <!-- Spaced like a dashboard panel body, in a slideover too -->
  <div class="flex flex-col gap-4 sm:gap-6">
    <!-- The revision: its record, who made it, and Undo / Restore -->
    <div class="flex flex-wrap items-start justify-between gap-4">
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

    <!-- E.g. the other changes of a Recent Changes entry -->
    <slot />

    <!-- What it changed, side by side or unified -->
    <div
      class="-mx-4 flex flex-wrap items-center justify-between gap-3 border-y border-default bg-elevated/50 px-4 py-3 sm:-mx-6 sm:px-6"
    >
      <span class="text-sm text-muted">
        <template v-if="detail">
          {{ countLabel(changeDiffs.length, 'field') }} changed
        </template>
      </span>

      <div class="flex items-center gap-2">
        <span class="text-sm text-muted max-sm:hidden">View Mode</span>
        <UTabs
          v-model="layout"
          :items="layoutItems"
          :content="false"
          size="xs"
          aria-label="View mode"
        />
      </div>
    </div>

    <div v-if="detailLoading && !detail" class="space-y-3">
      <USkeleton v-for="i in 3" :key="i" class="h-28 w-full" />
    </div>

    <div v-else-if="detail" class="space-y-4">
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
  </div>
</template>

<script setup lang="ts">
import type { RevisionDetail } from '~/utils/revisions'

// One revision, as History and Recent Changes both show it, inside a panel
// or slideover body: its record with who made it and when, Undo and Restore
// Revision, the default slot (Recent Changes puts the entry's other changes
// there), a band with how many fields changed and the view mode (side by
// side or unified), and the field diff (`useRevisionDetail`). Emits `loaded`
// with the revision, and `reverted` with the fields a revert wrote.
const props = defineProps<{ revisionId: number }>()

const emit = defineEmits<{
  loaded: [detail: RevisionDetail | null]
  reverted: [revert: { entityType: string; changes: Record<string, unknown> }]
}>()

const {
  detail,
  detailLoading,
  detailTitle,
  changeDiffs,
  undoFields,
  restoreFields,
  conflicts,
  selectRevision,
  confirmOpen,
  confirmMode,
  confirmTitle,
  confirmDescription,
  reverting,
  confirm,
  revert,
} = useRevisionDetail({ onReverted: (revert) => emit('reverted', revert) })

watch(() => props.revisionId, selectRevision, { immediate: true })
watch(detail, (value) => emit('loaded', value))

// Shared by every revision opened in this session.
const layout = useState<'split' | 'unified'>('revision-diff-layout', () => 'split')

const layoutItems = [
  { label: 'Side by Side', value: 'split', icon: 'hugeicons:layout-2-column' },
  { label: 'Unified', value: 'unified', icon: 'hugeicons:layout-2-row' },
]

const entityLabel = computed(() =>
  detail.value ? `this ${revisionEntityLabel(detail.value).toLowerCase()}` : '',
)
</script>
