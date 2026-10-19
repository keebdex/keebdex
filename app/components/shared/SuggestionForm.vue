<template>
  <component
    :is="FORMS[entityType]"
    v-model="model"
    mode="embedded"
    v-bind="bindings"
    @update:uploading="(value: boolean) => emit('update:uploading', value)"
  />
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { SuggestionEntityType } from '~/utils/suggestions'

// The record's own atomic form in embedded mode, so suggestions always offer
// the same fields as the admin forms. Starts from the record plus `initial`
// (a pending suggestion's values) and reports the changed columns as
// `changes`.
const props = defineProps<{
  entityType: SuggestionEntityType
  record: Record<string, any>
  initial?: Record<string, any> | null
  formProps?: Record<string, unknown>
}>()

const emit = defineEmits<{ 'update:uploading': [uploading: boolean] }>()

const changes = defineModel<Record<string, unknown>>('changes', {
  default: () => ({}),
})

const FORMS: Record<SuggestionEntityType, Component> = {
  artisan_colorway: defineAsyncComponent(
    () => import('~/components/artisan/modal/ColorwayForm.vue'),
  ),
  artisan_sculpt: defineAsyncComponent(
    () => import('~/components/artisan/modal/SculptForm.vue'),
  ),
  keyset_kit: defineAsyncComponent(
    () => import('~/components/keyset/modal/KeysetKitForm.vue'),
  ),
  keyset: defineAsyncComponent(
    () => import('~/components/keyset/modal/KeysetForm.vue'),
  ),
  keyboard_variant: defineAsyncComponent(
    () => import('~/components/keyboard/modal/VariantForm.vue'),
  ),
  keyboard_release: defineAsyncComponent(
    () => import('~/components/keyboard/modal/ReleaseForm.vue'),
  ),
  keyboard: defineAsyncComponent(
    () => import('~/components/keyboard/modal/KeyboardForm.vue'),
  ),
}

const model = ref<Record<string, any>>({
  ...props.record,
  ...(props.initial || {}),
})

// KeysetForm keeps the group buy dates in a separate range.
const dateRange = shallowRef<{ start?: unknown; end?: unknown } | null>(null)

const bindings = computed(() => ({
  ...SUGGESTION_ENTITIES[props.entityType].formProps(props.record),
  ...props.formProps,
  ...(props.entityType === 'keyset' && {
    dateRange: dateRange.value,
    'onUpdate:dateRange': (value: typeof dateRange.value) => {
      dateRange.value = value
    },
  }),
}))

watch(
  [model, dateRange],
  () => {
    const values = { ...model.value }

    if (dateRange.value) {
      values.start_date = dateRange.value.start ?? null
      values.end_date = dateRange.value.end ?? null
    }

    changes.value = suggestionDiff(props.entityType, props.record, values)
  },
  { deep: true, immediate: true },
)
</script>
