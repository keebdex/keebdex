<template>
  <SharedRevisionTimeline :entries="items">
    <template #default="{ entry }">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <UBadge
              :label="badge(entry).label"
              :icon="badge(entry).icon"
              variant="outline"
              size="sm"
              class="shrink-0"
            />
            <!-- The whole row opens the revision, or lists the run's changes -->
            <button
              type="button"
              class="truncate text-start font-semibold text-highlighted hover:text-primary focus:outline-none after:absolute after:inset-0"
              @click="choose(entry)"
            >
              {{ title(entry) }}
            </button>
          </div>

          <p class="mt-1 text-xs text-muted">
            <UAvatar
              v-bind="revisionAvatar(first(entry))"
              size="3xs"
              class="me-1 align-middle"
            />
            <span class="font-medium text-toned">
              {{ revisionAuthor(first(entry)) }}
            </span>
            {{ summary(entry) }}
            ·
            <time :datetime="entry.date" :title="formatDate(entry.date)">
              {{ formatTimeAgo(new Date(entry.date)) }}
            </time>
          </p>
        </div>

        <UIcon
          name="hugeicons:arrow-right-01"
          class="size-4 shrink-0 text-dimmed"
          aria-hidden="true"
        />
      </div>
    </template>
  </SharedRevisionTimeline>
</template>

<script setup lang="ts">
import type { Revision, RevisionEntry } from '~/utils/revisions'

// History of a page on the commit-style timeline (`SharedRevisionTimeline`):
// a row per revision, leading with the record's kind and its own name, then
// who changed it, what they did, and when. The changes of one sync run are
// one row (`groupRevisions`, the groups the API pages by). Selecting a
// revision opens it in the History slideover; selecting a run lists its
// changes there.
const props = defineProps<{ entries: RevisionEntry[] }>()

const emit = defineEmits<{
  select: [revision: Revision]
  selectRun: [revisions: Revision[]]
}>()

const first = (entry: RevisionEntry) =>
  entry.type === 'revision' ? entry.revision : entry.revisions[0]!

const items = computed(() =>
  props.entries.map((entry) => ({ ...entry, date: first(entry).created_at })),
)

const badge = (entry: RevisionEntry) =>
  entry.type === 'revision'
    ? { label: revisionEntityLabel(entry.revision), icon: undefined }
    : { label: 'Sync Run', icon: revisionIcon(first(entry)) }

// The page itself goes by its full name (its kind is the badge).
const title = (entry: RevisionEntry) => {
  if (entry.type === 'run') return revisionNameList(entry.revisions)

  return isPageRevision(entry.revision)
    ? entry.revision.label || revisionRecordName(entry.revision)
    : revisionRecordName(entry.revision)
}

/** `edited`, `added`, `deleted`; `made 3 changes` for a run. */
const summary = (entry: RevisionEntry) =>
  entry.type === 'revision'
    ? REVISION_ACTION_LABELS[entry.revision.action].toLowerCase()
    : `made ${countLabel(entry.revisions.length, 'change')}`

const choose = (entry: RevisionEntry) => {
  if (entry.type === 'revision') emit('select', entry.revision)
  else emit('selectRun', entry.revisions)
}
</script>
