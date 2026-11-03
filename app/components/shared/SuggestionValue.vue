<template>
  <SharedDiffImage v-if="image && value" :src="String(value)" :alt="alt" />

  <div v-else-if="colors && Array.isArray(value)" class="flex flex-wrap gap-1.5">
    <UBadge
      v-for="id in value"
      :key="id"
      :label="colorLabel(id)"
      :color="highlight.includes(id) ? color : undefined"
      variant="subtle"
      size="sm"
    >
      <template #leading>
        <span
          class="size-2.5 shrink-0 rounded-full ring ring-default"
          :style="{ backgroundColor: details[id]?.hex }"
        />
      </template>
    </UBadge>
    <span v-if="!value.length" class="text-sm">—</span>
  </div>

  <p v-else class="text-sm whitespace-pre-line break-words">
    <span :class="tone && TONE_CLASS[tone]">{{ text }}</span>
  </p>
</template>

<script setup lang="ts">
import type { RevisionColor } from '~/utils/revisions'

// One side of a changed field (edit suggestions, revision diffs): an image
// as a thumbnail, a keyset's colors as swatches (`highlight` lists the ids
// only on this side, tinted `color`), anything else as formatted text.
// `tone` marks text as removed (red, struck through) or added (green).
const props = withDefaults(
  defineProps<{
    field: string
    value: unknown
    // Record values around the field, e.g. the currency of a price.
    values?: Record<string, any>
    alt?: string
    highlight?: number[]
    color?: 'error' | 'success'
    tone?: 'removed' | 'added'
  }>(),
  {
    values: () => ({}),
    alt: undefined,
    highlight: () => [],
    color: undefined,
    tone: undefined,
  },
)

const TONE_CLASS = {
  removed:
    'rounded-sm bg-error/10 px-1 text-error line-through box-decoration-clone',
  added: 'rounded-sm bg-success/10 px-1 text-success box-decoration-clone',
}

const colors = computed(() => props.field === 'colors')
const image = computed(() => isImageSuggestionField(props.field))

// Only a keyset's colors load color details (the field never changes).
const { details } =
  props.field === 'colors'
    ? useKeysetColorDetails(() =>
        Array.isArray(props.value) ? (props.value as number[]) : [],
      )
    : { details: ref<Record<number, RevisionColor>>({}) }

const colorLabel = (id: number) => keysetColorLabel(details.value[id] || { id })

const text = computed(() =>
  formatSuggestionValue(props.field, props.value, props.values),
)
</script>
