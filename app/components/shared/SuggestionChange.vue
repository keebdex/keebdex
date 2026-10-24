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
        <a
          v-if="image && side.value"
          :href="String(side.value)"
          target="_blank"
          rel="noopener"
        >
          <NuxtImg
            :src="String(side.value)"
            :alt="label"
            class="max-h-40 rounded border border-default object-contain"
          />
        </a>
        <p v-else class="text-sm whitespace-pre-line break-words">
          {{ formatSuggestionValue(field, side.value, side.values) }}
        </p>
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
// One changed field of an edit suggestion: its label, the value before and
// after (images as thumbnails), with slots for a checkbox in place of the
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
  }>(),
  {
    beforeValues: () => ({}),
    afterValues: () => ({}),
    labels: () => ['Current', 'New'],
  },
)

const label = computed(() => suggestionFieldLabel(props.field))
const image = computed(() => isImageSuggestionField(props.field))

const sides = computed(() => [
  {
    label: props.labels[0],
    value: props.before,
    values: props.beforeValues,
  },
  {
    label: props.labels[1],
    value: props.after,
    values: props.afterValues,
  },
])
</script>
