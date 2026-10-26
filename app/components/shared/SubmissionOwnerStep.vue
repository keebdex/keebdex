<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">{{ hint }}</p>

    <UTabs
      v-if="mode === 'create' && options.length"
      v-model="ownerMode"
      :items="tabs"
      size="sm"
    />

    <p v-if="mode === 'review' && reviewStatus" class="text-sm text-muted">
      This {{ label.toLowerCase() }} was proposed with this submission and is
      still under review. Review and edit it here before approving.
    </p>

    <USelectMenu
      v-if="ownerMode === 'existing'"
      v-model="selected.id"
      :items="options"
      :loading="loading"
      :disabled="mode === 'review'"
      value-key="value"
      label-key="label"
      :placeholder="`Select a ${label.toLowerCase()}`"
      class="w-full"
    />

    <!-- The module's own form: MakerForm, ProfileForm, or BrandForm -->
    <slot v-else />
  </div>
</template>

<script setup>
// Step 1 of a submission wizard (useSubmissionOwner): pick an existing maker,
// profile, or brand, or propose a new one in the module's own form (default
// slot). In review the pick is locked, and the form only shows while the
// owner is still under review.
const props = defineProps({
  // `Maker`, `Profile`, or `Brand`.
  label: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  reviewStatus: {
    type: String,
    default: null,
  },
  mode: {
    type: String,
    default: 'create',
  },
  hint: {
    type: String,
    required: true,
  },
})

const selected = defineModel('selected', { type: Object, required: true })
const ownerMode = defineModel('ownerMode', { type: String, default: 'existing' })

const tabs = computed(() => [
  { label: `Choose Existing ${props.label}`, value: 'existing' },
  { label: `Propose New ${props.label}`, value: 'new' },
])
</script>
