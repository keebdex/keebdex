<template>
  <div class="divide-y divide-default rounded-md border border-default">
    <div
      v-for="revision in revisions"
      :key="revision.id"
      class="flex items-start gap-2 px-3 py-2"
    >
      <div class="min-w-0 flex-1 space-y-1">
        <p class="text-xs text-muted">
          <SharedRevisionAuthors :revisions="[revision]" />
          {{ revisionVerb(revision) }}
          ·
          <time
            :datetime="revision.created_at"
            :title="formatDateTime(revision.created_at)"
          >
            {{ formatTimeAgo(revision.created_at) }}
          </time>
        </p>

        <div class="flex flex-wrap items-center gap-2 text-sm">
          <template v-for="(value, index) in changeOf(revision)" :key="index">
            <UIcon
              v-if="index"
              name="hugeicons:arrow-right-02"
              class="size-4 shrink-0 text-dimmed"
            />
            <SharedDiffImage
              v-if="image && value"
              :src="String(value)"
              :alt="suggestionFieldLabel(field)"
              compact
            />
            <span v-else class="break-words">
              {{ formatSuggestionValue(field, value, values) }}
            </span>
          </template>
        </div>
      </div>

      <UTooltip v-if="revisionPagePath(revision)" text="Open in History">
        <UButton
          icon="hugeicons:time-quarter-pass"
          size="xs"
          variant="ghost"
          aria-label="Open in History"
          target="_blank"
          :to="`${revisionPagePath(revision)}?history=1&rev=${revision.id}`"
        />
      </UTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Revision } from '~/utils/revisions'

// Why a field of an edit suggestion shows Changed Since: the revisions that
// changed it after the suggestion was written, newest first, each with its
// authors, the value before and after, and a link to it in the page's
// History (a new tab, so the review stays open).
const props = defineProps<{
  field: string
  revisions: Revision[]
  // Record values around the field, e.g. the currency of a price.
  values?: Record<string, any>
}>()

const image = computed(() => isImageSuggestionField(props.field))

const changeOf = (revision: Revision) =>
  revision.changes?.[props.field] || [null, null]
</script>
