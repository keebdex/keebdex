<template>
  <div class="space-y-4">
    <div v-if="candidate.review_note || candidate.reviewed_at" class="text-sm">
      <p class="text-muted">
        {{ CANDIDATE_STATE_LABELS[candidate.state] }}
        <template v-if="candidate.reviewer?.full_name">
          by {{ candidate.reviewer.full_name }}
        </template>
        <template v-if="candidate.reviewed_at">
          {{ formatTimeAgo(candidate.reviewed_at) }}
        </template>
      </p>
      <p
        v-if="candidate.review_note"
        class="whitespace-pre-line text-highlighted"
      >
        {{ candidate.review_note }}
      </p>
    </div>

    <UTable
      :data="fieldRows"
      :columns="fieldColumns"
      :ui="{
        root: 'rounded-md border border-default bg-default',
        th: 'py-2',
      }"
      class="min-w-0 max-w-full"
    >
      <template #field-cell="{ row }">
        <span class="font-medium">
          {{ suggestionFieldLabel(row.original.field) }}
        </span>
      </template>

      <template #forum-cell="{ row }">
        <IngestFieldValue
          :field="row.original.field"
          :value="row.original.forum"
        />
      </template>

      <template #current-cell="{ row }">
        <IngestFieldValue
          :field="row.original.field"
          :value="row.original.current"
        />
      </template>

      <template #confidence-cell="{ row }">
        <IngestConfidenceBadge
          :value="candidate.confidence[row.original.field]"
          :missing="row.original.missing"
        />
      </template>
    </UTable>

    <UTable
      :data="kitRows"
      :columns="kitColumns"
      :ui="{
        root: 'rounded-md border border-default bg-default',
        th: 'py-2',
      }"
      class="min-w-0 max-w-full"
    >
      <template #img-cell="{ row }">
        <NuxtImg
          v-if="row.original.img"
          preset="thumb"
          loading="lazy"
          decoding="async"
          :src="row.original.img"
          :alt="kitName(row.original)"
          class="size-10 rounded object-cover"
        />
      </template>

      <template #dimensions-cell="{ row }">
        <SharedImageDimensions :src="row.original.img" />
      </template>

      <template #kit-cell="{ row }">
        <span class="font-medium">{{ kitName(row.original) }}</span>
      </template>

      <template #confidence-cell>
        <IngestConfidenceBadge :value="candidate.confidence.kits" />
      </template>

      <template #result-cell="{ row }">
        <UBadge
          v-if="listedKits.has(row.original.kit_id)"
          label="Listed"
          variant="subtle"
        />
        <UBadge v-else label="New" variant="subtle" color="success" />
      </template>

      <template #empty>
        <span class="text-error">The extractor found no kits.</span>
      </template>
    </UTable>

    <div v-if="candidate.thread.images.length" class="space-y-2">
      <p class="text-sm text-muted">
        Images in the first post ({{ candidate.thread.images.length }})
      </p>

      <div class="flex flex-wrap gap-2">
        <ULink
          v-for="image in candidate.thread.images"
          :key="image"
          :to="image"
          target="_blank"
          rel="noopener noreferrer"
        >
          <NuxtImg
            preset="thumb"
            loading="lazy"
            decoding="async"
            :src="image"
            alt=""
            class="size-16 rounded object-cover"
          />
        </ULink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IngestCandidate } from '~/utils/ingest'

// The expanded row of a forum review candidate: every keyset field with the
// extractor's confidence (and, for a keyset Keebdex has, its current value and
// whether approving fills it), the kits, and the images of the first post.
const props = defineProps<{ candidate: IngestCandidate }>()

const { kits: kitCategories } = useKeysetKits()

const matched = computed(() => !!props.candidate.current)
const listedKits = computed(
  () => new Set(props.candidate.current?.kits.map((kit) => kit.kit_id)),
)

const fieldColumns = computed(() => [
  { id: 'field', header: 'Field' },
  { id: 'forum', header: 'Forum' },
  ...(matched.value ? [{ id: 'current', header: 'Keebdex' }] : []),
  { id: 'confidence', header: 'Confidence' },
])

const fieldRows = computed(() => {
  const missing = missingCandidateFields(props.candidate)
  const { keyset } = props.candidate.payload
  const current = props.candidate.current?.keyset

  return CANDIDATE_KEYSET_FIELDS.filter(
    (field) =>
      missing.includes(field) ||
      !isBlank(keyset[field]) ||
      !isBlank(current?.[field]),
  ).map((field) => ({
    field,
    forum: keyset[field],
    current: current?.[field],
    missing: missing.includes(field),
  }))
})

const kitColumns = computed(() => [
  { id: 'img', header: 'Image' },
  { id: 'dimensions', header: 'Size' },
  { id: 'kit', header: 'Kit' },
  { id: 'confidence', header: 'Confidence' },
  ...(matched.value ? [{ id: 'result', header: 'Keebdex' }] : []),
])

const kitRows = computed(() => props.candidate.payload.kits)

const kitName = (kit: Record<string, any>) =>
  kit.name ||
  kitCategories.value.find((category) => category.slug === kit.kit_id)?.name ||
  kit.kit_id
</script>
