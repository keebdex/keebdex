<template>
  <div class="space-y-4">
    <!-- Review: the form while still under review, else what is published -->
    <template v-if="mode === 'review'">
      <template v-if="underReview">
        <p class="text-sm text-muted">
          This {{ entity }} is still under review. Review and edit it here
          before approving.
        </p>

        <slot />
      </template>

      <div v-else class="space-y-2">
        <p class="text-sm text-muted">
          This {{ entity }} is already published. Only the {{ reviewed }} is
          reviewed here.
        </p>

        <NuxtLink
          v-if="name && to"
          :to="to"
          class="text-sm font-medium text-primary hover:underline"
        >
          {{ name }}
        </NuxtLink>
        <p v-else-if="name" class="text-sm font-medium">{{ name }}</p>
      </div>
    </template>

    <!-- Create: pick an existing one, or propose a new one in its form -->
    <template v-else>
      <p v-if="hint" class="text-sm text-muted">{{ hint }}</p>

      <UTabs v-if="tabs" v-model="entityMode" :items="tabItems" size="sm" />

      <template v-if="entityMode === 'existing'">
        <slot name="select">
          <USelectMenu
            v-model="selected"
            :items="options"
            :loading="loading"
            value-key="value"
            label-key="label"
            :placeholder="`Select a ${entity}`"
            class="w-full"
          />
        </slot>
      </template>

      <slot v-else />
    </template>
  </div>
</template>

<script setup>
// One step of a submission wizard above the reviewed item (maker, profile, or
// brand; sculpt, keyset, or keyboard; release). Create: an Existing / New
// toggle (`tabs`, shown only when there is something to pick), the pick
// (`select` slot, a USelectMenu of `options` by default), or the entity's own
// form (default slot) for a new one. Review: the form while the entity is
// still under review, otherwise its name (and link) as published.
const props = defineProps({
  // Title Case entity name: `Maker`, `Sculpt`, `Release`.
  label: {
    type: String,
    required: true,
  },
  // What the review wizard reviews: `colorway`, `kit`, `variant`.
  reviewed: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    default: 'create',
  },
  hint: {
    type: String,
    default: '',
  },
  tabs: Boolean,
  options: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  underReview: Boolean,
  // Review of a published entity: its name, and its page when it has one.
  name: {
    type: String,
    default: '',
  },
  to: {
    type: String,
    default: '',
  },
})

const entityMode = defineModel('entityMode', {
  type: String,
  default: 'existing',
})
const selected = defineModel('selected', { type: String, default: '' })

const entity = computed(() => props.label.toLowerCase())

const tabItems = computed(() => [
  { label: `Choose Existing ${props.label}`, value: 'existing' },
  { label: `Propose New ${props.label}`, value: 'new' },
])
</script>
