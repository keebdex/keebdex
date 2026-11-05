<template>
  <div v-if="rows.length" class="space-y-3">
    <div
      v-for="row in rows"
      :key="row.key"
      class="overflow-hidden rounded-lg border border-default bg-default"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-2 border-b border-default bg-elevated/50 px-4 py-2.5"
      >
        <span class="text-sm font-semibold text-highlighted">
          {{ row.label }}
        </span>

        <div class="flex flex-wrap items-center gap-1.5">
          <UBadge
            v-if="highlight.includes(row.key)"
            label="Changed Since"
            color="warning"
            variant="outline"
            size="sm"
          />
          <UBadge
            :label="KIND_LABELS[row.kind]"
            :icon="KIND_ICONS[row.kind]"
            :color="KIND_COLORS[row.kind]"
            variant="subtle"
            size="sm"
          />
        </div>
      </div>

      <!-- Side by side: before on the left, after on the right -->
      <div
        v-if="layout === 'split'"
        class="grid divide-y divide-default sm:grid-cols-2 sm:divide-x sm:divide-y-0"
      >
        <div
          v-for="side in row.sides"
          :key="side.label"
          :class="['min-w-0 space-y-1.5 p-4', side.class]"
        >
          <p class="text-xs font-medium tracking-wide text-muted uppercase">
            {{ side.label }}
          </p>
          <SharedSuggestionValue
            :field="row.key"
            :value="side.value"
            :values="side.values"
            :alt="row.label"
            :highlight="side.only"
            :color="side.color"
            :tone="side.empty ? undefined : side.tone"
          />
        </div>
      </div>

      <!-- Unified: the removed value, then the added one -->
      <div v-else class="divide-y divide-default">
        <template v-for="side in row.sides" :key="side.label">
          <div
            v-if="!side.empty"
            :class="['flex min-w-0 items-start gap-3 px-4 py-3', side.class]"
          >
            <span
              :class="[
                'w-3 shrink-0 font-mono text-sm leading-5 select-none',
                side.tone === 'removed' ? 'text-error' : 'text-success',
              ]"
              :aria-label="side.label"
            >
              {{ side.tone === 'removed' ? '−' : '+' }}
            </span>
            <div class="min-w-0 flex-1">
              <SharedSuggestionValue
                :field="row.key"
                :value="side.value"
                :values="side.values"
                :alt="row.label"
                :highlight="side.only"
                :color="side.color"
                :tone="side.tone"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <p v-else class="text-sm text-muted">{{ empty }}</p>
</template>

<script setup lang="ts">
import type { RevisionFieldDiff } from '~/utils/revisions'

// Field-by-field comparison of a revision (History, Recent Changes): a card
// per field, named by its suggestion label and marked Added, Modified or
// Removed, with the value before and after side by side (`split`) or one
// under the other (`unified`, removed in red, added in green). Values render
// like edit suggestions do (formatted text, image thumbnails, color
// swatches). `highlight` marks fields edited again since the revision.
const props = withDefaults(
  defineProps<{
    diffs: RevisionFieldDiff[]
    beforeValues?: Record<string, any>
    afterValues?: Record<string, any>
    highlight?: string[]
    layout?: 'split' | 'unified'
    empty?: string
  }>(),
  {
    beforeValues: () => ({}),
    afterValues: () => ({}),
    highlight: () => [],
    layout: 'split',
    empty: 'No fields to compare.',
  },
)

type DiffKind = 'added' | 'modified' | 'removed'

const KIND_LABELS: Record<DiffKind, string> = {
  added: 'Added',
  modified: 'Modified',
  removed: 'Removed',
}

const KIND_ICONS: Record<DiffKind, string> = {
  added: 'solar:add-circle-line-duotone',
  modified: 'solar:pen-new-square-line-duotone',
  removed: 'solar:minus-circle-line-duotone',
}

const KIND_COLORS = {
  added: 'success',
  modified: 'warning',
  removed: 'error',
} as const

// Before in red, after in green; a side without a value stays untinted.
const SIDES = [
  { label: 'Before', tone: 'removed', color: 'error', tint: 'bg-error/5' },
  { label: 'After', tone: 'added', color: 'success', tint: 'bg-success/5' },
] as const

const rows = computed(() =>
  props.diffs.map((diff) => {
    const kind: DiffKind = isBlank(diff.before)
      ? 'added'
      : isBlank(diff.after)
        ? 'removed'
        : 'modified'
    const values = [diff.before, diff.after]
    const records = [props.beforeValues, props.afterValues]

    return {
      key: diff.key,
      label: suggestionFieldLabel(diff.key),
      kind,
      sides: SIDES.map((side, index) => {
        const value = values[index]
        const empty = isBlank(value)

        return {
          ...side,
          value,
          values: records[index],
          empty,
          only: onlyIn(value, values[1 - index]),
          class: empty ? undefined : side.tint,
        }
      }),
    }
  }),
)
</script>
