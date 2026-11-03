<template>
  <SharedRevisionDays :entries="items">
    <template #default="{ entry }">
      <SharedRevisionCard
        :icon="revisionEntityIcon(entry.revision)"
        :icon-label="revisionEntityLabel(entry.revision)"
        :title="title(entry.revision)"
        :revisions="entry.revisions"
        :date="entry.date"
        :verb="revisionVerb(entry.revision)"
        @select="emit('select', entry.revision)"
      />
    </template>
  </SharedRevisionDays>
</template>

<script setup lang="ts">
import type { Revision } from '~/utils/revisions'

// History of a page, in the cards Recent Changes uses (`SharedRevisionDays`,
// `SharedRevisionCard`): a card per revision with the record's kind as the
// icon avatar, its own name, who changed it, what they did, and when.
// Selecting one opens it in the History slideover.
const props = defineProps<{ revisions: Revision[] }>()

const emit = defineEmits<{ select: [revision: Revision] }>()

const items = computed(() =>
  props.revisions.map((revision) => ({
    key: `rev-${revision.id}`,
    date: revision.created_at,
    revision,
    // Stable across renders, for the card's authors.
    revisions: [revision],
  })),
)

// The page itself goes by its full name (its kind is the avatar).
const title = (revision: Revision) =>
  (isPageRevision(revision) && revision.label) || revisionRecordName(revision)
</script>
