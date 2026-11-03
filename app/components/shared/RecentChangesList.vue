<template>
  <SharedRevisionDays :entries="entries">
    <template #default="{ entry }">
      <SharedRevisionCard
        :icon="KEEB_MODULE_ICONS[entry.domain]"
        :icon-label="KEEB_MODULE_LABELS[entry.domain]"
        :title="entry.name"
        :revisions="entry.revisions"
        :date="entry.date"
        :badge="countLabel(entry.revisions.length, 'change')"
        :selected="selected?.key === entry.key"
        @select="emit('select', entry)"
      />
    </template>
  </SharedRevisionDays>
</template>

<script setup lang="ts">
import type { RecentChangesEntry } from '~/utils/revisions'

// The list side of Recent Changes, in the cards History uses
// (`SharedRevisionDays`, `SharedRevisionCard`): a card per run of changes to
// a page (`groupRecentChanges`) with its module as the icon avatar, its
// name, who changed it, when, and how many changes. Selecting a card opens
// it in `SharedRecentChangesDetail`.
defineProps<{
  entries: RecentChangesEntry[]
  selected?: RecentChangesEntry | null
}>()

const emit = defineEmits<{ select: [entry: RecentChangesEntry] }>()
</script>
