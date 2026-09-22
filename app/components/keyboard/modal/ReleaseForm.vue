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
      name="variant_specs"
      help="Enable this for commissions or special drops where every colorway has different materials or pricing. Disable for standard runs where all boards share the same specs."
    >
      <USwitch
        v-model="release.variant_specs"
        label="Unique Specs per Variant"
      />
    </UFormField>

    <template v-if="!release.variant_specs">
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
    </template>

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
import { keyboardReleaseSchema } from '~/utils/schemas/keyboard'

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
})

const toast = useToast()
const currencies = Constants.public.Enums.currency

const release = ref({
  name: '',
  description: '',
  order: null,
  release_year: null,
  variant_specs: false,
  pcb_types: [],
  currency: 'USD',
  msrp_price: null,
  case_materials: [],
  plate_materials: [],
  weight_materials: [],
})

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

  if (!Array.isArray(release.value.case_materials)) {
    release.value.case_materials = release.value.case_materials
      ? [release.value.case_materials]
      : []
  }

  if (!Array.isArray(release.value.plate_materials)) {
    release.value.plate_materials = release.value.plate_materials
      ? [release.value.plate_materials]
      : []
  }

  if (!Array.isArray(release.value.weight_materials)) {
    release.value.weight_materials = release.value.weight_materials
      ? [release.value.weight_materials]
      : []
  }

  // Auto-calculate order for new releases
  if (!isEdit && !release.value.order) {
    release.value.order = (keyboard.releases?.length ?? 0) + 1
  }
})

watch(
  () => modelValue,
  (value) => {
    if (value) {
      Object.assign(release.value, value)
    }
  },
  { deep: true },
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
      handleError({
        statusMessage:
          'Please save the keyboard details before adding a release.',
      }),
    )
    return
  }

  await $fetch(`/api/keyboards/${keyboard.brand_keyboard_slug}/releases`, {
    method: 'post',
    body: release.value,
  })
    .then((data) => {
      toast.add(
        handleSuccess(isEdit ? 'update' : 'add', release.value.name, 'Release'),
      )
      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
