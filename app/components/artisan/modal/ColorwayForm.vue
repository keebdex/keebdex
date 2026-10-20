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

    <div class="grid gap-2" :class="showOrder ? 'grid-cols-2' : 'grid-cols-1'">
      <UFormField label="Quantity" name="quantity">
        <UInput
          v-model.number="colorway.qty"
          icon="hugeicons:text-number-sign"
          class="w-full"
        />
      </UFormField>

      <UFormField v-if="showOrder" label="Order" name="order">
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

    <UFormField label="Stem" name="stem">
      <USelectMenu
        v-model="stems"
        :items="stemItems"
        multiple
        icon="hugeicons:cross"
        placeholder="Select stem types"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea
        v-model.trim="colorway.description"
        :rows="5"
        placeholder="The story behind this colorway, its theme, or how it was made"
        class="w-full"
      />
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

      <SharedImageUpload
        v-model="uploadedFile"
        v-model:src="colorway.img"
        :max-size-mb="maxUploadSizeMb"
        :loading="uploadingImage"
        class="mt-2"
      />
      <SharedImageDimensions :src="colorway.img" variant="help" />
    </UFormField>

    <UFormField
      label="Photo Credit"
      name="photo_credit"
      help="Leave empty when the photo is from the maker. For a collector's photo, credit their Discord or Instagram handle."
    >
      <UInput
        v-model.trim="colorway.photo_credit"
        icon="hugeicons:camera-add-02"
        placeholder="e.g. @username"
        class="w-full"
      />
    </UFormField>

    <UButton
      v-if="isStandalone"
      block
      color="primary"
      type="submit"
      :loading="uploading || uploadingImage"
      :disabled="uploadingImage || imageUploadFailed"
    >
      {{ moderator || colorway.id ? 'Save' : 'Submit for Review' }}
    </UButton>
  </component>
</template>

<script setup>
import { Constants } from '~/types/database.types'
import { isEqual } from 'es-toolkit'
import {
  artisanSaleFormats,
  artisanSpecialSaleFormats,
  artisanStems,
  colorwaySchema,
  colorwayGdocManagedFields,
} from '~/utils/schemas/artisan'

const emit = defineEmits(['onSuccess', 'update:modelValue', 'update:uploading'])

const props = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Object,
    default: null,
  },
  // Explicit maker id for the image upload assignment when embedded (e.g. the
  // submission wizard), since colorway.maker_id isn't set from route params there.
  makerId: {
    type: String,
    default: '',
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
const userStore = useUserStore()
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

const moderator = computed(() => userStore.isModerator)
const showOrder = computed(() => moderator.value && !props.suggest)
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

// Several stems can apply; an empty selection is stored as null
const stems = computed({
  get: () => colorway.value.stem || [],
  set: (value) => {
    colorway.value.stem = value.length ? value : null
  },
})

// Values already saved outside the list stay visible so they can be removed
const stemItems = computed(() => [
  ...new Set([...artisanStems, ...stems.value]),
])

const maxUploadSizeMb = getMaxUploadSizeMb('artisan')
const uploading = ref(false)
const uploadingImage = ref(false)
const imageUploadFailed = ref(false)
const uploadedFile = ref(null)


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
  imageUploadFailed.value = false

  // Removed image: a failed upload no longer blocks saving
  if (!file) {
    emit('update:uploading', false)
    return
  }

  uploadingImage.value = true
  emit('update:uploading', true)

  try {
    colorway.value.img = await uploadImageToCloudflare({
      file,
      assignment: props.makerId || colorway.value.maker_id,
      category: 'artisan',
    })
  } catch (e) {
    toast.add(errorToast(e))
    imageUploadFailed.value = true
  } finally {
    uploadingImage.value = false
    emit('update:uploading', imageUploadFailed.value)
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
  if (!isStandalone.value || uploadingImage.value || imageUploadFailed.value) {
    return
  }

  try {
    uploading.value = true

    const payload = {
      ...colorway.value,
    }

    if (!colorway.value.id) {
      payload.source = 'keebdex'
      payload.overridden_fields = []
    } else {
      const dirtyFields = colorwayGdocManagedFields.filter(
        (field) => !isEqual(payload[field], originalColorway.value[field]),
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

    if (!moderator.value && created?.review_status === 'Pending') {
      toast.add(noticeToast('submission_pending'))
    } else {
      toast.add(
        successToast(colorway.value.id ? 'update' : 'add', {
          entity: 'Colorway',
          name: payload.name,
        }),
      )
    }
    emit('onSuccess')
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    uploading.value = false
  }
}
</script>
