<template>
  <UForm :schema="schema" :state="release" class="space-y-4" @submit="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <UFormField label="Release Name" name="name" required>
        <UInput
          v-model.trim="release.name"
          icon="hugeicons:tag-01"
          placeholder="e.g. Round 1"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Release Year" name="release_year">
        <UInput
          v-model.number="release.release_year"
          type="number"
          icon="hugeicons:calendar-03"
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- Specs are set once and inherited: what the release leaves empty,
         each variant sets for itself -->
    <p class="text-sm text-muted">
      Fill in only what every variant shares. For commissions or special drops
      where colorways differ, leave the rest empty and set it on each variant.
    </p>

    <UFormField label="Base Price" name="msrp_price">
      <UFieldGroup class="w-full">
        <USelect v-model="release.currency" :items="currencies" />
        <UInput
          v-model.number="release.msrp_price"
          type="number"
          step="0.01"
          placeholder="0.00"
          class="w-full"
        />
      </UFieldGroup>
    </UFormField>

    <UFormField
      v-if="topCaseStyleOptions.length"
      label="Top Case"
      name="top_case_styles"
      help="Leave empty when this release came in every layout of the keyboard."
    >
      <USelectMenu
        v-model="release.top_case_styles"
        :items="topCaseStyleOptions"
        multiple
        placeholder="All layouts"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Case" name="case_materials">
      <USelectMenu
        v-model="release.case_materials"
        :items="Constants.public.Enums.keyboard_material"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="PCB" name="pcb_types">
      <USelectMenu
        v-model="release.pcb_types"
        :items="Constants.public.Enums.keyboard_pcb_type"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Plate" name="plate_materials">
      <USelectMenu
        v-model="release.plate_materials"
        :items="Constants.public.Enums.keyboard_material"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Weight" name="weight_materials">
      <USelectMenu
        v-model="release.weight_materials"
        :items="Constants.public.Enums.keyboard_material"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="release.description" :rows="5" class="w-full" />
    </UFormField>

    <UButton
      v-if="mode === 'standalone'"
      block
      color="primary"
      type="submit"
      loading-auto
    >
      Save
    </UButton>
  </UForm>
</template>

<script setup>
import { Constants } from '~/types/database.types'
import {
  keyboardReleaseSchema,
  keyboardTopCaseStylesEnabled,
} from '~/utils/schemas/keyboard'

const emit = defineEmits(['onSuccess', 'update:modelValue'])

const { metadata, modelValue, isEdit, keyboard, mode } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Object,
    default: null,
  },
  isEdit: Boolean,
  keyboard: {
    type: Object,
    default: () => ({}),
  },
  mode: {
    type: String,
    default: 'standalone',
    validator: (value) => ['standalone', 'embedded'].includes(value),
  },
  // Suggest Edit (SharedSuggestionForm) passes it to every form; a release
  // has no field a suggestion cannot change.
  suggest: Boolean,
})

const toast = useToast()
const currencies = Constants.public.Enums.currency

const release = ref({
  name: '',
  description: '',
  order: null,
  release_year: null,
  top_case_styles: [],
  pcb_types: [],
  currency: 'USD',
  msrp_price: null,
  case_materials: [],
  plate_materials: [],
  weight_materials: [],
})

// A release narrows its keyboard's layouts (all of them for a keyboard that
// lists none yet); only some form factors have them.
const topCaseStyleOptions = computed(() =>
  keyboardTopCaseStylesEnabled.includes(keyboard.form_factor)
    ? keyboard.top_case_styles?.length
      ? keyboard.top_case_styles
      : Constants.public.Enums.keyboard_top_case_style
    : [],
)

const schema = keyboardReleaseSchema.refine(
  (value) => {
    const normalized = value.name.trim().toLowerCase()

    return !(keyboard.releases || []).some((release) => {
      const sameId = isEdit && metadata?.id && release.id === metadata.id
      if (sameId) return false

      return (
        String(release.name || '')
          .trim()
          .toLowerCase() === normalized
      )
    })
  },
  {
    path: ['name'],
    message: 'Release name must be unique for this keyboard',
  },
)

onBeforeMount(() => {
  Object.assign(release.value, modelValue || metadata || {}, {
    brand_slug: keyboard.brand_slug,
    brand_keyboard_slug: keyboard.brand_keyboard_slug,
  })

  for (const field of [
    'top_case_styles',
    'case_materials',
    'pcb_types',
    'plate_materials',
    'weight_materials',
  ]) {
    if (!Array.isArray(release.value[field])) {
      release.value[field] = release.value[field] ? [release.value[field]] : []
    }
  }

  // Auto-calculate order for new releases
  if (!isEdit && !release.value.order) {
    release.value.order = (keyboard.releases?.length ?? 0) + 1
  }
})

watch(
  () => modelValue,
  (value) => {
    if (value && value !== release.value) {
      Object.assign(release.value, value)
    }
  },
)

watch(
  release,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

const onSubmit = async () => {
  if (mode !== 'standalone') return

  if (!keyboard.brand_keyboard_slug) {
    toast.add(
      validationToast(
        'Please save the keyboard details before adding a release.',
        'Keyboard Not Saved',
      ),
    )
    return
  }

  await $fetch(`/api/keyboards/${keyboard.brand_keyboard_slug}/releases`, {
    method: 'post',
    body: release.value,
  })
    .then((data) => {
      toast.add(
        successToast(isEdit ? 'update' : 'add', { entity: 'Release', name: release.value.name }),
      )
      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
}
</script>
