<template>
  <UForm
    :schema="keyboardVariantStandaloneSchema"
    :state="variant"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Variant Name" name="variant_name" required>
      <UInput
        v-model.trim="variant.variant_name"
        icon="solar:text-square-bold-duotone"
        class="w-full"
      />
    </UFormField>

    <div class="grid gap-2" :class="suggest ? 'grid-cols-1' : 'grid-cols-2'">
      <UFormField v-if="!suggest" label="Release" name="release_id" required>
        <USelect
          v-model="variant.release_id"
          :items="releaseOptions"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Release Year"
        name="release_year"
        help="Only when it came out in another year than its release."
      >
        <UInput
          v-model.number="variant.release_year"
          type="number"
          icon="solar:calendar-bold-duotone"
          :placeholder="inherited.year ? String(inherited.year) : undefined"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Sale Type" name="sale_type">
        <USelect
          v-model="variant.sale_type"
          :items="saleFormats"
          icon="solar:tag-price-bold-duotone"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Units Produced" name="units_produced">
        <UInput
          v-model.number="variant.units_produced"
          type="number"
          icon="solar:box-bold-duotone"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField label="Finish Type" name="finish_type" required>
      <USelect
        v-model="variant.finish_type"
        :items="Constants.public.Enums.keyboard_finish_type"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="MSRP"
      name="msrp_price"
      :help="
        inheritsReleasePrice(variant)
          ? 'Leave empty to use the release price. Set a currency only when it was sold in another one than its release.'
          : 'A special sale does not take the release price: set its own, or leave it empty when it had none.'
      "
    >
      <UFieldGroup class="w-full">
        <USelect
          v-model="variant.currency"
          :items="currencies"
          :placeholder="selectedRelease?.currency || 'USD'"
        />
        <UInput
          v-model.number="variant.msrp_price"
          type="number"
          step="0.01"
          :placeholder="inherited.price || '0.00'"
          class="w-full"
        />
      </UFieldGroup>
    </UFormField>

    <!-- Empty fields take the release's value, shown as their placeholder -->
    <p class="text-sm text-muted">
      Leave the materials empty to use the release's; set only what this
      variant changes.
    </p>

    <UFormField label="Case" name="case_materials">
      <USelectMenu
        v-model="variant.case_materials"
        :placeholder="inheritedMaterial('case_materials')"
        :items="Constants.public.Enums.keyboard_material"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="PCB" name="pcb_types">
      <USelectMenu
        v-model="variant.pcb_types"
        :placeholder="inheritedMaterial('pcb_types')"
        :items="Constants.public.Enums.keyboard_pcb_type"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Plate" name="plate_materials">
      <USelectMenu
        v-model="variant.plate_materials"
        :placeholder="inheritedMaterial('plate_materials')"
        :items="Constants.public.Enums.keyboard_material"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Weight" name="weight_materials">
      <USelectMenu
        v-model="variant.weight_materials"
        :placeholder="inheritedMaterial('weight_materials')"
        :items="Constants.public.Enums.keyboard_material"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Front Image" name="img_front">
      <UInput
        v-model.trim="variant.img_front"
        icon="solar:gallery-bold-duotone"
        class="w-full"
      />

      <SharedImageUpload
        v-model="uploadedFileFront"
        v-model:src="variant.img_front"
        :max-size-mb="maxUploadSizeMb"
        :loading="uploadingFileFront"
        class="mt-2"
      />
      <SharedImageDimensions :src="variant.img_front" variant="help" />
    </UFormField>

    <UFormField label="Back Image" name="img_back">
      <UInput
        v-model.trim="variant.img_back"
        icon="solar:gallery-bold-duotone"
        class="w-full"
      />

      <SharedImageUpload
        v-model="uploadedFileBack"
        v-model:src="variant.img_back"
        :max-size-mb="maxUploadSizeMb"
        :loading="uploadingFileBack"
        class="mt-2"
      />
      <SharedImageDimensions :src="variant.img_back" variant="help" />
    </UFormField>

    <UFormField label="Photo Credit" name="photo_credit">
      <UInput
        v-model.trim="variant.photo_credit"
        icon="solar:camera-add-bold-duotone"
        class="w-full"
      />
    </UFormField>

    <UButton
      v-if="mode === 'standalone'"
      block
      color="primary"
      type="submit"
      :loading="saving || isUploadingImage"
      :disabled="isUploadingImage || hasFailedImage"
    >
      Save
    </UButton>
  </UForm>
</template>

<script setup>
import { Constants } from '~/types/database.types'
import { keyboardVariantStandaloneSchema } from '~/utils/schemas/keyboard'

const emit = defineEmits([
  'onSuccess',
  'update:modelValue',
  'update:uploading',
])

const { metadata, modelValue, isEdit, keyboard, mode, suggest } = defineProps({
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
  // Suggest Edit (SharedSuggestionForm): hides the fields a suggestion
  // cannot change.
  suggest: Boolean,
})

const toast = useToast()
const currencies = Constants.public.Enums.currency
const saleFormatEnums = Constants.public.Enums.sale_format
const saleFormats = [
  {
    type: 'label',
    label: 'Standard',
  },
  ...saleFormatEnums.filter((format) => !SPECIAL_SALE_FORMATS.includes(format)),
  {
    type: 'separator',
  },
  {
    type: 'label',
    label: 'Special',
  },
  ...saleFormatEnums.filter((format) => SPECIAL_SALE_FORMATS.includes(format)),
]

const variant = ref({
  release_id: null,
  variant_name: '',
  finish_type: Constants.public.Enums.keyboard_finish_type[0],
  units_produced: null,
  sale_type: saleFormatEnums[0],
  release_year: null,
  img_front: '',
  img_back: '',
  photo_credit: '',
  currency: null,
  msrp_price: null,
  case_materials: [],
  pcb_types: [],
  plate_materials: [],
  weight_materials: [],
})

const maxUploadSizeMb = getMaxUploadSizeMb('keyboard')
const saving = ref(false)
const uploadingFileFront = ref(false)
const uploadingFileBack = ref(false)
const failedFileFront = ref(false)
const failedFileBack = ref(false)
const uploadedFileFront = ref(null)
const uploadedFileBack = ref(null)
const isUploadingImage = computed(
  () => uploadingFileFront.value || uploadingFileBack.value,
)
const hasFailedImage = computed(
  () => failedFileFront.value || failedFileBack.value,
)
// A variant inherits its release's year, price, and materials and sets its
// own only where it differs.
const selectedRelease = computed(() =>
  (keyboard.releases || []).find(
    (release) => String(release.id) === String(variant.value.release_id),
  ),
)

// What an empty field inherits, shown as its placeholder; a special sale
// takes no price from its release
const inherited = computed(() =>
  resolveVariantSpecs(
    { sale_type: variant.value.sale_type },
    selectedRelease.value || {},
  ),
)

const inheritedMaterial = (field) => {
  const value = joinSpecList(inherited.value.materials[field])
  return value ? `Release: ${value}` : undefined
}

onBeforeMount(() => {
  Object.assign(variant.value, modelValue || metadata || {}, {
    brand_slug: keyboard.brand_slug,
    brand_keyboard_slug: keyboard.brand_keyboard_slug,
  })

  for (const field of [
    'case_materials',
    'pcb_types',
    'plate_materials',
    'weight_materials',
  ]) {
    variant.value[field] = toArray(variant.value[field])
  }
})

watch(
  () => modelValue,
  (value) => {
    if (value && value !== variant.value) {
      Object.assign(variant.value, value)
    }
  },
)

watch(
  variant,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

const releaseOptions = computed(() => {
  return (keyboard.releases || []).map((release) => ({
    label: release.name,
    value: release.id,
  }))
})

const uploadImage = async (file, field, uploadState) => {
  const failedState =
    field === 'img_front' ? failedFileFront : failedFileBack
  failedState.value = false

  // Removed image: a failed upload no longer blocks saving
  if (!file) {
    emit('update:uploading', isUploadingImage.value || hasFailedImage.value)
    return
  }

  uploadState.value = true
  emit('update:uploading', true)

  try {
    variant.value[field] = await uploadImageToCloudflare({
      file,
      assignment: String(keyboard.brand_slug || ''),
      category: 'keyboard',
    })
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
    failedState.value = true
  } finally {
    uploadState.value = false
    emit('update:uploading', isUploadingImage.value || hasFailedImage.value)
  }
}

watch(uploadedFileFront, (file) =>
  uploadImage(file, 'img_front', uploadingFileFront),
)
watch(uploadedFileBack, (file) =>
  uploadImage(file, 'img_back', uploadingFileBack),
)

const onSubmit = async () => {
  if (
    mode !== 'standalone' ||
    isUploadingImage.value ||
    hasFailedImage.value
  ) {
    return
  }

  if (!keyboard.brand_keyboard_slug) {
    toast.add(
      validationToast(
        'Please save the keyboard details before adding a variant.',
        'Keyboard Not Saved',
      ),
    )
    return
  }

  try {
    saving.value = true

    // The server saves empty materials as null: the variant takes its
    // release's
    const data = await $fetch(
      `/api/keyboards/${keyboard.brand_keyboard_slug}/variants`,
      {
        method: 'post',
        body: variant.value,
      },
    )

    toast.add(
      successToast(isEdit ? 'update' : 'add', { entity: 'Variant', name: variant.value.variant_name }),
    )
    uploadedFileFront.value = null
    uploadedFileBack.value = null
    emit('onSuccess', data)
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    saving.value = false
  }
}
</script>
