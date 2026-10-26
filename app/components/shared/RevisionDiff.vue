<template>
  <div
    v-if="diffs.length"
    class="divide-y divide-default rounded-lg border border-default"
  >
    <SharedSuggestionChange
      v-for="diff in diffs"
      :key="diff.key"
      :field="diff.key"
      :before="diff.before"
      :after="diff.after"
      :before-values="beforeValues"
      :after-values="afterValues"
      :labels="labels"
      :color-details="colorDetails"
    >
      <template v-if="highlight.includes(diff.key)" #actions>
        <UBadge
          label="Changed Since"
          color="warning"
          variant="soft"
          size="sm"
        />
      </template>
    </SharedSuggestionChange>
  </div>

  <p v-else class="text-sm text-muted">{{ empty }}</p>
</template>

<script setup lang="ts">
import type { RevisionColor, RevisionFieldDiff } from '~/utils/revisions'

// Field-by-field comparison for the History slideover, built on the edit
// suggestion rows (labels, formatted values, image thumbnails). `highlight`
// marks fields edited again since the revision.
withDefaults(
  defineProps<{
    diffs: RevisionFieldDiff[]
    labels?: [string, string]
    beforeValues?: Record<string, any>
    afterValues?: Record<string, any>
    highlight?: string[]
    empty?: string
    colorDetails?: Record<number, RevisionColor>
  }>(),
  {
    labels: () => ['Before', 'After'],
    beforeValues: () => ({}),
    afterValues: () => ({}),
    highlight: () => [],
    empty: 'No fields to compare.',
    colorDetails: () => ({}),
  },
)
</script>
