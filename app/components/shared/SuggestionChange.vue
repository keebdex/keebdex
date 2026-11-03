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
        <SharedSuggestionValue
          :field="field"
          :value="side.value"
          :values="side.values"
          :alt="label"
          :highlight="side.only"
          :color="side.color"
        />
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
// One changed field of an edit suggestion: its label, the value before and
// after (images as thumbnails, a keyset's colors as swatches, removed ones in
// red and added ones in green), with slots for a checkbox in place of the
// label, for actions such as Undo, and for details below the values. A
// keyset's colors come as ids, the side after also as the colors to add and
// remove, which it shows applied to the side before.
const props = withDefaults(
  defineProps<{
    field: string
    // Shown instead of the field's own label.
    label?: string
    before: unknown
    after: unknown
    // Record values around each side, e.g. the currency of a price.
    beforeValues?: Record<string, any>
    afterValues?: Record<string, any>
    labels?: [string, string]
  }>(),
  {
    beforeValues: () => ({}),
    afterValues: () => ({}),
    label: undefined,
    labels: () => ['Current', 'New'],
  },
)

const colors = computed(() => props.field === 'colors')

const ids = (value: unknown) => (Array.isArray(value) ? (value as number[]) : [])

const before = computed(() => props.before)
const after = computed(() =>
  colors.value && isColorsChange(props.after)
    ? colorsAfter(ids(props.before), props.after)
    : props.after,
)

// Items on one side only: removed before, added after.
const only = (value: unknown, other: unknown) =>
  Array.isArray(value)
    ? value.filter((item) => !(Array.isArray(other) && other.includes(item)))
    : []

const label = computed(() => props.label || suggestionFieldLabel(props.field))

const sides = computed(() => [
  {
    label: props.labels[0],
    value: before.value,
    values: props.beforeValues,
    only: only(before.value, after.value),
    color: 'error' as const,
  },
  {
    label: props.labels[1],
    value: after.value,
    values: props.afterValues,
    only: only(after.value, before.value),
    color: 'success' as const,
  },
])
</script>
