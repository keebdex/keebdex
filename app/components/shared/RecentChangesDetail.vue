<template>
  <UDashboardPanel id="recent-changes-detail">
    <template #header>
      <UDashboardNavbar :toggle="false">
        <template #leading>
          <UButton
            icon="hugeicons:arrow-left-02"
            variant="ghost"
            aria-label="Back to Recent Changes"
            class="-ms-1.5 lg:hidden"
            @click="emit('close')"
          />
        </template>

        <template #title>
          <UBreadcrumb :items="breadcrumb" class="min-w-0" />
        </template>

        <template #right>
          <UTooltip v-if="pagePath" text="Open History">
            <UButton
              icon="hugeicons:time-quarter-pass"
              aria-label="Open History"
              :to="`${pagePath}?history=1&rev=${revisionId}`"
            />
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- The revision: its record, who made it, and Undo / Restore -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0 space-y-1">
          <USkeleton v-if="!detail" class="h-7 w-64" />
          <h2
            v-else
            class="text-2xl font-semibold text-highlighted text-pretty"
          >
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

      <!-- Every change in the entry, newest first -->
      <section v-if="revisions.length > 1" class="space-y-2">
        <h3
          class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase"
        >
          <UIcon name="hugeicons:time-quarter-pass" class="size-4 text-primary" />
          Revisions ({{ revisions.length }})
        </h3>

        <div class="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
          <button
            v-for="(revision, index) in revisions"
            :key="revision.id"
            type="button"
            :aria-pressed="revision.id === revisionId"
            :class="[
              'inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-primary',
              revision.id === revisionId
                ? 'border-inverted bg-inverted text-inverted'
                : 'border-default bg-default text-toned hover:bg-elevated',
            ]"
            @click="emit('select', revision.id)"
          >
            <UIcon :name="revisionIcon(revision)" class="size-3.5 shrink-0" />
            <span class="truncate font-medium">
              {{ chipName(revision) }}
            </span>
            <time
              :datetime="revision.created_at"
              :title="formatDateTime(revision.created_at)"
              class="shrink-0 opacity-70"
            >
              {{ formatTimeAgo(revision.created_at) }}
            </time>
            <UBadge
              v-if="index === 0"
              label="Latest"
              color="warning"
              variant="solid"
              size="sm"
              class="shrink-0 rounded-full px-1.5 py-0 text-[10px] leading-4"
            />
          </button>
        </div>
      </section>

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
    </template>
  </UDashboardPanel>

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
import type { BreadcrumbItem } from '@nuxt/ui'
import type { RecentChangesEntry, Revision } from '~/utils/revisions'

// The detail side of Recent Changes: one revision of the selected entry
// (`revisionId`, from `?rev=`), with the entry's other changes as chips to
// switch between, the field diff (side by side or unified), and Undo /
// Restore (`useRevisionDetail`).
// The entry can be missing for a deep link to a revision not loaded in the
// list; the revision then names its page itself. Emits `reverted` so the
// list reloads, and `close` (the back button on phones).
const props = defineProps<{
  entry: RecentChangesEntry | null
  revisionId: number
}>()

const emit = defineEmits<{
  select: [id: number]
  close: []
  reverted: []
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
} = useRevisionDetail({ onReverted: () => emit('reverted') })

watch(() => props.revisionId, selectRevision, { immediate: true })

const layout = ref<'split' | 'unified'>('split')

const layoutItems = [
  { label: 'Side by Side', value: 'split', icon: 'hugeicons:layout-2-column' },
  { label: 'Unified', value: 'unified', icon: 'hugeicons:layout-2-row' },
]

const revisions = computed(() => props.entry?.revisions || [])

// The page the revision belongs to, from the entry or the revision itself.
const page = computed(() => {
  const source = props.entry
    ? { domain: props.entry.domain, parent_key: props.entry.parentKey }
    : detail.value

  return source
    ? {
        domain: source.domain,
        name: props.entry?.name || detail.value?.label || source.parent_key,
        path: revisionPagePath(source),
      }
    : null
})

const pagePath = computed(() => page.value?.path)

const breadcrumb = computed<BreadcrumbItem[]>(() =>
  page.value
    ? [
        {
          label: `${KEEB_MODULE_LABELS[page.value.domain]}s`,
          icon: KEEB_MODULE_ICONS[page.value.domain],
        },
        { label: page.value.name || 'Page', to: page.value.path || undefined },
      ]
    : [],
)

const entityLabel = computed(() =>
  detail.value ? `this ${revisionEntityLabel(detail.value).toLowerCase()}` : '',
)

// The page itself goes by its full name, its records by their own.
const chipName = (revision: Revision) =>
  isPageRevision(revision)
    ? revisionEntityLabel(revision)
    : revisionRecordName(revision)
</script>
