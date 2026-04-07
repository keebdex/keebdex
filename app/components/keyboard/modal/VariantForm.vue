<template>
  <UForm :schema="schema" :state="variant" class="space-y-4" @submit="onSubmit">
    <UFormField label="Release" name="release_id" required>
      <USelect
        v-model="variant.release_id"
        :items="releaseOptions"
        value-key="value"
        label-key="label"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Variant Name" name="variant_name" required>
      <UInput
        v-model.trim="variant.variant_name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Release Year" name="release_year">
        <UInput
          v-model.number="variant.release_year"
          type="number"
          icon="hugeicons:calendar-03"
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

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Finish Type" name="finish_type" required>
        <USelect
          v-model="variant.finish_type"
          :items="Constants.public.Enums.keyboard_finish_type"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Sale Type" name="sale_type">
        <USelect
          v-model="variant.sale_type"
          :items="saleFormats"
          icon="hugeicons:sale-tag-02"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField label="Image URL" name="image_url">
      <UInput
        v-model.trim="variant.image_url"
        icon="hugeicons:image-02"
        class="w-full"
      />

      <p class="mt-2 text-xs text-muted">
        Or drag and drop an image below to upload and auto-fill this field.
      </p>

      <div class="mt-2 space-y-2">
        <UFileUpload
          v-model="uploadedFile"
          accept="image/*"
          icon="hugeicons:image-upload"
          layout="list"
          label="Click to browse or drag & drop an image to upload"
          description="Maximum file size: 10MB"
          :ui="{
            base: 'min-h-40',
          }"
        />

        <UButton
          v-if="uploadedFile"
          icon="hugeicons:clean"
          block
          @click="uploadedFile = null"
        >
          Clear Selection
        </UButton>
      </div>
    </UFormField>

    <UFormField label="Photo Credit" name="photo_credit">
      <UInput
        v-model.trim="variant.photo_credit"
        icon="hugeicons:camera-add-02"
        class="w-full"
      />
    </UFormField>

    <UButton block color="primary" type="submit" :loading="uploading">
      Save
    </UButton>
  </UForm>
</template>

<script setup>
import { Constants } from '~/types/database.types'
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit, keyboard, releases } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
  keyboard: {
    type: Object,
    default: () => ({}),
  },
  releases: {
    type: Array,
    default: () => [],
  },
})

const toast = useToast()
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
  image_url: '',
  photo_credit: '',
})

const uploading = ref(false)
const uploadedFile = ref(null)

const schema = z.object({
  release_id: z.coerce.number().min(1),
  variant_name: z.string().min(1),
  finish_type: z.enum(Constants.public.Enums.keyboard_finish_type),
  units_produced: z.coerce.number().min(0).nullish(),
  sale_type: z.enum(saleFormatEnums).nullish().or(z.string().min(0).max(0)),
  release_year: z.coerce.number().min(1900).max(2100).nullish(),
  image_url: z.url().nullish().or(z.string().min(0).max(0)),
  photo_credit: z.string().max(255).nullish().or(z.string().min(0).max(0)),
})

const setDefaultReleaseYear = () => {
  if (isEdit) return

  const selectedRelease = (releases || []).find(
    (release) => Number(release.id) === Number(variant.value.release_id),
  )

  if (!selectedRelease) return

  if (
    variant.value.release_year === null ||
    variant.value.release_year === undefined
  ) {
    variant.value.release_year = selectedRelease.release_year ?? null
  }
}

onBeforeMount(() => {
  Object.assign(variant.value, metadata || {}, {
    brand_slug: keyboard.brand_slug,
    brand_keyboard_slug: keyboard.brand_keyboard_slug,
  })

  setDefaultReleaseYear()
})

watch(
  () => variant.value.release_id,
  () => {
    setDefaultReleaseYear()
  },
)

const releaseOptions = computed(() => {
  return releases.map((release) => ({
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

    if (uploadedFile.value) {
      payload.image_url = await uploadImageToCloudflare({
        file: uploadedFile.value,
        assignment: String(keyboard.brand_keyboard_slug || ''),
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
    uploadedFile.value = null
    emit('onSuccess', data)
  } catch (error) {
    toast.add(handleError(error))
  } finally {
    uploading.value = false
  }
}
</script>
