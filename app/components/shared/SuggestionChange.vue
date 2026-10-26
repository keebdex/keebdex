<template>
  <div class="p-3 space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <slot name="label" :label="label">
        <span class="text-sm font-medium">{{ label }}</span>
      </slot>

      <div class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <div v-for="side in sides" :key="side.label" class="min-w-0 space-y-1">
        <p class="text-xs text-muted">{{ side.label }}</p>
        <SharedDiffImage
          v-if="image && side.value"
          :src="String(side.value)"
          :alt="label"
        />
        <div
          v-else-if="field === 'colors' && Array.isArray(side.value)"
          class="flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="id in side.value"
            :key="id"
            :label="colorLabel(id)"
            :color="side.only.includes(id) ? side.color : undefined"
            variant="subtle"
            size="sm"
          >
            <template #leading>
              <span
                class="size-2.5 shrink-0 rounded-full ring ring-default"
                :style="{ backgroundColor: colorDetails[id]?.hex }"
              />
            </template>
          </UBadge>
          <span v-if="!side.value.length" class="text-sm">—</span>
        </div>
        <p v-else class="text-sm whitespace-pre-line break-words">
          {{ formatSuggestionValue(field, side.value, side.values) }}
        </p>
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
import type { RevisionColor } from '~/utils/revisions'

// One changed field of an edit suggestion: its label, the value before and
// after (images as thumbnails, a keyset's colors as swatches, removed ones in
// red and added ones in green), with slots for a checkbox in place of the
// label, for actions such as Undo, and for details below the values.
const props = withDefaults(
  defineProps<{
    field: string
    before: unknown
    after: unknown
    // Record values around each side, e.g. the currency of a price.
    beforeValues?: Record<string, any>
    afterValues?: Record<string, any>
    labels?: [string, string]
    // Colors named by a `colors` value, by id.
    colorDetails?: Record<number, RevisionColor>
  }>(),
  {
    beforeValues: () => ({}),
    afterValues: () => ({}),
    labels: () => ['Current', 'New'],
    colorDetails: () => ({}),
  },
)

const colorLabel = (id: number) => {
  const color = props.colorDetails[id]

  return color ? `${color.system} ${color.code}` : `Color ${id}`
}

// Items on one side only: removed before, added after.
const only = (value: unknown, other: unknown) =>
  Array.isArray(value)
    ? value.filter((item) => !(Array.isArray(other) && other.includes(item)))
    : []

const label = computed(() => suggestionFieldLabel(props.field))
const image = computed(() => isImageSuggestionField(props.field))

const sides = computed(() => [
  {
    label: props.labels[0],
    value: props.before,
    values: props.beforeValues,
    only: only(props.before, props.after),
    color: 'error' as const,
  },
  {
    label: props.labels[1],
    value: props.after,
    values: props.afterValues,
    only: only(props.after, props.before),
    color: 'success' as const,
  },
])
</script>
