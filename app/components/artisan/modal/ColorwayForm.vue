<template>
  <component :is="formWrapper" v-bind="formWrapperProps" @submit="onSubmit">
    <UFormField label="Name" name="name">
      <UInput
        v-model.trim="colorway.name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Release" name="release">
      <UInput
        v-model.trim="colorway.release"
        icon="hugeicons:calendar-02"
        placeholder="DD MMM YYYY"
        class="w-full"
      />
    </UFormField>

    <div class="grid gap-2" :class="moderator ? 'grid-cols-2' : 'grid-cols-1'">
      <UFormField label="Quantity" name="quantity">
        <UInput
          v-model.number="colorway.qty"
          icon="hugeicons:text-number-sign"
          class="w-full"
        />
      </UFormField>

      <UFormField v-if="moderator" label="Order" name="order">
        <UInput
          v-model.number="colorway.order"
          icon="hugeicons:text-number-sign"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Sale Type" name="sale_type">
        <USelect
          v-model="colorway.sale_type"
          :items="saleFormats"
          icon="hugeicons:sale-tag-02"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="!artisanSpecialSaleFormats.includes(colorway.sale_type)"
        label="Price"
        name="price"
      >
        <UFieldGroup class="w-full">
          <USelect v-model="colorway.currency" :items="currencies" />
          <UInput v-model.number="colorway.price" class="w-full" />
        </UFieldGroup>
      </UFormField>
    </div>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="colorway.description" :rows="5" class="w-full" />
    </UFormField>

    <UFormField
      label="Image"
      name="img"
      help="Please ensure the image is square (e.g., 1:1 aspect ratio) and focused
        closely on the keycap for the best display."
    >
      <UInput
        v-model.trim="colorway.img"
        icon="hugeicons:image-02"
        class="w-full"
      />

      <div class="mt-2 space-y-2">
        <UFileUpload
          v-model="uploadedFile"
          accept="image/*"
          icon="hugeicons:image-upload"
          layout="grid"
          label="Click to browse or drag & drop an image to upload"
          :description="`Maximum file size: ${maxUploadSizeMb}MB`"
          :ui="{ base: 'aspect-video' }"
        />
      </div>
    </UFormField>

    <UFormField label="Photo Credit" name="photo_credit">
      <UInput
        v-model.trim="colorway.photo_credit"
        icon="hugeicons:camera-add-02"
        class="w-full"
      />
    </UFormField>

    <UButton
      v-if="isStandalone"
      block
      color="primary"
      type="submit"
      :loading="uploading"
    >
      {{ moderator || colorway.id ? 'Save' : 'Submit for Review' }}
    </UButton>
  </component>
</template>

<script setup>
import { Constants } from '~/types/database.types'
import {
  artisanSaleFormats,
  artisanSpecialSaleFormats,
  colorwaySchema,
} from '~/utils/schemas/artisan'

const emit = defineEmits(['onSuccess', 'update:modelValue'])

const props = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Object,
    default: null,
  },
  moderator: Boolean,
  mode: {
    type: String,
    default: 'standalone',
    validator: (value) => ['standalone', 'embedded'].includes(value),
  },
})

const toast = useToast()
const route = useRoute()

const currencies = Constants.public.Enums.currency

const saleFormats = [
  {
    type: 'label',
    label: 'Standard',
  },
  ...artisanSaleFormats.filter(
    (format) => !artisanSpecialSaleFormats.includes(format),
  ),
  {
    type: 'separator',
  },
  {
    type: 'label',
    label: 'Special',
  },
  ...artisanSaleFormats.filter((format) =>
    artisanSpecialSaleFormats.includes(format),
  ),
]

const moderator = computed(() => props.moderator)
const isStandalone = computed(() => props.mode === 'standalone')
const formWrapper = computed(() =>
  isStandalone.value ? resolveComponent('UForm') : 'div',
)
const formWrapperProps = computed(() =>
  isStandalone.value
    ? { schema: colorwaySchema, state: colorway.value, class: 'space-y-4' }
    : { class: 'space-y-4' },
)

const defaultColorway = () => ({
  name: '',
  img: '',
  maker_id: String(route.params.maker || route.query.maker || ''),
  sculpt_id: String(route.params.sculpt || route.query.sculpt || ''),
  maker_sculpt_id: `${String(route.params.maker || route.query.maker || '')}/${String(route.params.sculpt || route.query.sculpt || '')}`,
  order: 0,
  currency: 'USD',
  sale_type: 'Raffle',
})

const colorway = ref(defaultColorway())

const maxUploadSizeMb = getMaxUploadSizeMb('artisan')
const uploading = ref(false)
const uploadedFile = ref(null)

// Fields sourced from the Google Doc sync; editing them locally overrides the sync
const GDOC_MANAGED_FIELDS = [
  'name',
  'release',
  'qty',
  'photo_credit',
  'img',
  'stem',
]

const originalColorway = ref({})

onBeforeMount(() => {
  Object.assign(
    colorway.value,
    defaultColorway(),
    props.modelValue || props.metadata,
  )
  originalColorway.value = { ...props.metadata }
})

watch(
  () => props.modelValue,
  (value) => {
    if (value && value !== colorway.value) {
      Object.assign(colorway.value, defaultColorway(), value)
    }
  },
)

// Upload immediately on selection so embedded (wizard) usage doesn't rely on a standalone submit handler.
watch(uploadedFile, async (file) => {
  if (!file) return

  uploading.value = true

  try {
    colorway.value.img = await uploadImageToCloudflare({
      file,
      assignment: colorway.value.maker_id,
      category: 'artisan',
    })
  } catch (e) {
    toast.add(handleError(e))
  } finally {
    uploading.value = false
  }
})

watch(
  colorway,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

const onSubmit = async () => {
  if (!isStandalone.value) return

  try {
    uploading.value = true

    const payload = {
      ...colorway.value,
    }

    if (!colorway.value.id) {
      payload.source = 'keebdex'
      payload.overridden_fields = []
    } else {
      const dirtyFields = GDOC_MANAGED_FIELDS.filter(
        (field) => payload[field] !== originalColorway.value[field],
      )

      payload.overridden_fields = dirtyFields.length
        ? [
            ...new Set([
              ...(originalColorway.value.overridden_fields || []),
              ...dirtyFields,
            ]),
          ]
        : originalColorway.value.overridden_fields || []
    }

    const [created] = await $fetch(
      `/api/makers/${colorway.value.maker_id}/sculpts/${colorway.value.sculpt_id}/colorways`,
      {
        method: 'post',
        body: payload,
      },
    )

    if (!moderator.value && created?.status === 'Pending') {
      toast.add({
        title: 'Thanks for your contribution!',
        description:
          'Your colorway is now pending review and will display a Pending Review badge.',
        color: 'success',
      })
    } else {
      toast.add(
        handleSuccess(
          colorway.value.id ? 'update' : 'add',
          payload.name,
          'Colorway',
        ),
      )
    }
    emit('onSuccess')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    uploading.value = false
  }
}
</script>
