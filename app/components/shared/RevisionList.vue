<template>
  <SharedRevisionTimeline :entries="items">
    <template #default="{ entry }">
      <div class="flex items-center gap-3">
        <!-- Above the row's overlay, so its tooltip opens on hover -->
        <UTooltip :text="revisionEntityLabel(entry.revision)">
          <UAvatar
            :icon="revisionEntityIcon(entry.revision)"
            role="img"
            :aria-label="revisionEntityLabel(entry.revision)"
            class="relative z-10 shrink-0"
          />
        </UTooltip>

        <div class="min-w-0 flex-1">
          <!-- The whole row opens the revision -->
          <button
            type="button"
            class="block max-w-full truncate text-start font-semibold text-highlighted hover:text-primary focus:outline-none after:absolute after:inset-0"
            @click="emit('select', entry.revision)"
          >
            {{ title(entry.revision) }}
          </button>

          <p class="mt-1 text-xs text-muted">
            <SharedRevisionAuthors :revisions="[entry.revision]" />
            {{ revisionVerb(entry.revision) }}
            ·
            <time :datetime="entry.date" :title="formatDate(entry.date)">
              {{ formatTimeAgo(entry.date) }}
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
import type { Revision } from '~/utils/revisions'

// History of a page on the commit-style timeline (`SharedRevisionTimeline`):
// a row per revision, leading with the record's kind as an icon avatar
// (named by its tooltip, as Recent Changes names modules) and its own name, then
// who changed it, what they did, and when. Selecting one opens it in the
// History slideover.
const props = defineProps<{ revisions: Revision[] }>()

const emit = defineEmits<{ select: [revision: Revision] }>()

const items = computed(() =>
  props.revisions.map((revision) => ({
    key: `rev-${revision.id}`,
    date: revision.created_at,
    revision,
  })),
)

// The page itself goes by its full name (its kind is the badge).
const title = (revision: Revision) =>
  isPageRevision(revision)
    ? revision.label || revisionRecordName(revision)
    : revisionRecordName(revision)
</script>
