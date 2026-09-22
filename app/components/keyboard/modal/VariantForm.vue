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
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Release" name="release_id" required>
        <USelect
          v-model="variant.release_id"
          :items="releaseOptions"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Release Year" name="release_year">
        <UInput
          v-model.number="variant.release_year"
          type="number"
          icon="hugeicons:calendar-03"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Sale Type" name="sale_type">
        <USelect
          v-model="variant.sale_type"
          :items="saleFormats"
          icon="hugeicons:sale-tag-02"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Units Produced" name="units_produced">
        <UInput
          v-model.number="variant.units_produced"
          type="number"
          icon="hugeicons:package"
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
      help="Leave empty to use the release base price. Only set this if this variant has a different price."
    >
      <UFieldGroup class="w-full">
        <USelect v-model="variant.currency" :items="currencies" />
        <UInput
          v-model.number="variant.msrp_price"
          type="number"
          step="0.01"
          placeholder="0.00"
          class="w-full"
        />
      </UFieldGroup>
    </UFormField>

    <UFormField
      v-if="!specsPerVariant"
      name="override_release_specs"
      help="Enable for special editions with unique pricing or materials. Disable to inherit release defaults."
    >
      <UCheckbox v-model="overrideReleaseSpecs" label="Custom Variant Specs" />
    </UFormField>

    <template v-if="showVariantSpecFields">
      <UFormField label="Case" name="case_materials">
        <USelectMenu
          v-model="variant.case_materials"
          :items="Constants.public.Enums.keyboard_material"
          multiple
          class="w-full"
        />
      </UFormField>

      <UFormField label="PCB" name="pcb_types">
        <USelectMenu
          v-model="variant.pcb_types"
          :items="Constants.public.Enums.keyboard_pcb_type"
          multiple
          class="w-full"
        />
      </UFormField>

      <UFormField label="Plate" name="plate_materials">
        <USelectMenu
          v-model="variant.plate_materials"
          :items="Constants.public.Enums.keyboard_material"
          multiple
          class="w-full"
        />
      </UFormField>

      <UFormField label="Weight" name="weight_materials">
        <USelectMenu
          v-model="variant.weight_materials"
          :items="Constants.public.Enums.keyboard_material"
          multiple
          class="w-full"
        />
      </UFormField>
    </template>

    <UFormField label="Front Image" name="img_front">
      <UInput
        v-model.trim="variant.img_front"
        icon="hugeicons:image-02"
        class="w-full"
      />

      <p class="mt-2 text-xs text-muted">
        Or drag and drop an image below to upload and auto-fill this field.
      </p>

      <div class="mt-2 space-y-2">
        <UFileUpload
          v-model="uploadedFileFront"
          accept="image/*"
          icon="hugeicons:image-upload"
          layout="grid"
          label="Click to browse or drag & drop an image to upload"
          :description="`Maximum file size: ${maxUploadSizeMb}MB`"
          :ui="{
            base: 'aspect-video',
          }"
        />
      </div>
    </UFormField>

    <UFormField label="Back Image" name="img_back">
      <UInput
        v-model.trim="variant.img_back"
        icon="hugeicons:image-02"
        class="w-full"
      />

      <p class="mt-2 text-xs text-muted">
        Or drag and drop an image below to upload and auto-fill this field.
      </p>

      <div class="mt-2 space-y-2">
        <UFileUpload
          v-model="uploadedFileBack"
          accept="image/*"
          icon="hugeicons:image-upload"
          layout="grid"
          label="Click to browse or drag & drop a back image to upload"
          :description="`Maximum file size: ${maxUploadSizeMb}MB`"
          :ui="{
            base: 'aspect-video',
          }"
        />
      </div>
    </UFormField>

    <UFormField label="Photo Credit" name="photo_credit">
      <UInput
        v-model.trim="variant.photo_credit"
        icon="hugeicons:camera-add-02"
        class="w-full"
      />
    </UFormField>

    <UButton
      v-if="mode === 'standalone'"
      block
      color="primary"
      type="submit"
      :loading="uploading"
    >
      Save
    </UButton>
  </UForm>
</template>

<script setup>
import { Constants } from '~/types/database.types'
import { keyboardVariantStandaloneSchema } from '~/utils/schemas/keyboard'

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
const saleFormatEnums = Constants.public.Enums.sale_format
const specialFormats = ['Giveaway', 'Commission', 'Auction']
const saleFormats = [
  {
    type: 'label',
    label: 'Standard',
  },
  ...saleFormatEnums.filter((format) => !specialFormats.includes(format)),
  {
    type: 'separator',
  },
  {
    type: 'label',
    label: 'Special',
  },
  ...saleFormatEnums.filter((format) => specialFormats.includes(format)),
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
  currency: 'USD',
  msrp_price: null,
  case_materials: [],
  pcb_types: [],
  plate_materials: [],
  weight_materials: [],
})

const maxUploadSizeMb = getMaxUploadSizeMb('keyboard')
const uploading = ref(false)
const uploadedFileFront = ref(null)
const uploadedFileBack = ref(null)
const overrideReleaseSpecs = ref(false)

const specsPerVariant = computed(() => {
  const selectedRelease = keyboard.releases.find(
    (release) => Number(release.id) === Number(variant.value.release_id),
  )
  return selectedRelease?.variant_specs ?? false
})

const showVariantSpecFields = computed(
  () => specsPerVariant.value || overrideReleaseSpecs.value,
)

const hasMaterialOverrides = computed(() => {
  return (
    !!variant.value.case_materials?.length ||
    !!variant.value.pcb_types?.length ||
    !!variant.value.plate_materials?.length ||
    !!variant.value.weight_materials?.length
  )
})

const setDefaultReleaseYear = () => {
  if (isEdit) return

  const selectedRelease = keyboard.releases.find(
    (release) => Number(release.id) === Number(variant.value.release_id),
  )

  if (!selectedRelease) return

  if (!variant.value.release_year) {
    variant.value.release_year = selectedRelease.release_year ?? null
  }
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
    if (!Array.isArray(variant.value[field])) {
      variant.value[field] = variant.value[field] ? [variant.value[field]] : []
    }
  }

  overrideReleaseSpecs.value =
    specsPerVariant.value || hasMaterialOverrides.value

  setDefaultReleaseYear()
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

watch(
  () => variant.value.release_id,
  () => {
    setDefaultReleaseYear()
  },
)

const releaseOptions = computed(() => {
  return (keyboard.releases || []).map((release) => ({
    label: release.name,
    value: release.id,
  }))
})

const onSubmit = async () => {
  if (!keyboard.brand_keyboard_slug) {
    toast.add(
      handleError({
        statusMessage:
          'Please save the keyboard details before adding a variant.',
      }),
    )
    return
  }

  try {
    uploading.value = true

    const payload = {
      ...variant.value,
    }

    if (!showVariantSpecFields.value) {
      payload.case_materials = null
      payload.pcb_types = null
      payload.plate_materials = null
      payload.weight_materials = null
    }

    if (uploadedFileFront.value) {
      payload.img_front = await uploadImageToCloudflare({
        file: uploadedFileFront.value,
        assignment: String(keyboard.brand_slug || ''),
        category: 'keyboard',
      })
    }

    if (uploadedFileBack.value) {
      payload.img_back = await uploadImageToCloudflare({
        file: uploadedFileBack.value,
        assignment: String(keyboard.brand_slug || ''),
        category: 'keyboard',
      })
    }

    const data = await $fetch(
      `/api/keyboards/${keyboard.brand_keyboard_slug}/variants`,
      {
        method: 'post',
        body: payload,
      },
    )

    toast.add(
      handleSuccess(
        isEdit ? 'update' : 'add',
        variant.value.variant_name,
        'Variant',
      ),
    )
    uploadedFileFront.value = null
    uploadedFileBack.value = null
    emit('onSuccess', data)
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    uploading.value = false
  }
}
</script>
