<template>
  <button
    type="button"
    class="w-full text-start flex gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-elevated/50 focus-visible:bg-elevated/50 focus-visible:outline-none"
    @click="emit('select')"
  >
    <UIcon
      :name="revisionIcon(revision)"
      class="size-5 shrink-0 mt-0.5"
      :class="revisionColor(revision)"
    />

    <div class="min-w-0 flex-1 space-y-1">
      <p class="flex items-center gap-2 text-sm">
        <span class="truncate font-medium text-highlighted">
          {{ revision.label || revisionEntityLabel(revision) }}
        </span>
        <time
          v-if="!compact"
          :datetime="revision.created_at"
          :title="formatDate(revision.created_at)"
          class="ms-auto shrink-0 text-xs text-dimmed"
        >
          {{ formatTimeAgo(new Date(revision.created_at)) }}
        </time>
      </p>

      <p class="text-sm text-muted">
        {{ REVISION_ACTION_LABELS[revision.action] }}
        {{ revisionEntityLabel(revision).toLowerCase()
        }}<template v-if="!compact"> · {{ revisionAuthor(revision) }}</template>
      </p>

      <div v-if="fields.length" class="flex flex-wrap gap-1">
        <UBadge
          v-for="field in fields"
          :key="field"
          :label="suggestionFieldLabel(field)"
          variant="soft"
          size="sm"
        />
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { Revision } from '~/utils/revisions'

// One revision in the History slideover: the record, what happened, who or
// what did it, when, and the fields an edit changed. `compact` drops the
// author and time inside a sync run, whose summary row shows them.
const props = defineProps<{ revision: Revision; compact?: boolean }>()

const emit = defineEmits<{ select: [] }>()

const fields = computed(() => revisionFields(props.revision))
</script>
