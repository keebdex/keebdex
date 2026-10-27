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
import { parseDate } from '@internationalized/date'
import type { Component } from 'vue'
import type { SuggestionEntityType } from '~/utils/suggestions'

// The record's own atomic form in embedded mode, so suggestions always offer
// the same fields as the admin forms. Starts from the record plus `initial`
// (a pending suggestion's values) and reports the changed columns as
// `changes`; `reset(key)` puts a field back to the record's value.
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
  artisan_maker: defineAsyncComponent(
    () => import('~/components/artisan/modal/MakerForm.vue'),
  ),
  keyset_kit: defineAsyncComponent(
    () => import('~/components/keyset/modal/KeysetKitForm.vue'),
  ),
  keyset: defineAsyncComponent(
    () => import('~/components/keyset/modal/KeysetForm.vue'),
  ),
  keyset_profile: defineAsyncComponent(
    () => import('~/components/keyset/modal/ProfileForm.vue'),
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
  keyboard_brand: defineAsyncComponent(
    () => import('~/components/keyboard/modal/BrandForm.vue'),
  ),
}

// A pending suggestion holds a keyset's colors as the colors to add and
// remove; the form shows the colors the keyset would have.
const initialValues = () =>
  Object.fromEntries(
    Object.entries(props.initial || {}).map(([key, value]) => [
      key,
      isColorsChange(value) ? colorsAfter(props.record[key] || [], value) : value,
    ]),
  )

const model = ref<Record<string, any>>({
  ...props.record,
  ...initialValues(),
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

    changes.value = suggestionDiff(
      props.entityType,
      props.record,
      withSlugKeys(props.entityType, props.record, values),
    )
  },
  { deep: true, immediate: true },
)

const DATE_RANGE_KEYS: Record<string, 'start' | 'end'> = {
  start_date: 'start',
  end_date: 'end',
}

const toCalendarDate = (value: unknown) =>
  value ? parseDate(String(value).slice(0, 10)) : undefined

const reset = (key: string) => {
  // Keys follow the name, so undoing a new address undoes the rename.
  if (isSlugKey(props.entityType, key)) {
    key = SUGGESTION_ENTITIES[props.entityType].nameKey
  }

  const value = props.record[key] ?? null
  const isKeyset = props.entityType === 'keyset'
  const rangeKey = DATE_RANGE_KEYS[key]

  if (isKeyset && rangeKey) {
    const current = dateRange.value || {
      start: toCalendarDate(model.value.start_date),
      end: toCalendarDate(model.value.end_date),
    }

    dateRange.value = { ...current, [rangeKey]: toCalendarDate(value) }
    return
  }

  // A new object, so the form copies it into its own state.
  model.value = {
    ...model.value,
    [key]: isKeyset && key === 'ic_date' ? toCalendarDate(value) : value,
  }
}

defineExpose({ reset })
</script>
