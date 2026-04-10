<template>
  <UForm
    :schema="schema"
    :state="colorway"
    class="space-y-4"
    @submit="onSubmit"
  >
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
        class="w-full"
      />
    </UFormField>

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Quantity" name="quantity">
        <UInput
          v-model.number="colorway.qty"
          icon="hugeicons:text-number-sign"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Order" name="order">
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
        v-if="!specialFormats.includes(colorway.sale_type)"
        label="Price"
        name="price"
      >
        <UFieldGroup>
          <USelect v-model="colorway.currency" :items="currencies" />
          <UInput v-model.number="colorway.price" />
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
      :required="!isEditMode"
      help="Please ensure the image is square (e.g., 1:1 aspect ratio) and focused closely on the keycap for the best display. Maximum file size: 10MB."
    >
      <div v-if="isEditMode && colorway.img && !replaceMode" class="space-y-3">
        <NuxtImg
          :src="colorway.img"
          :alt="`${colorway.name || 'Colorway'} Image`"
          class="w-full max-h-60 object-contain rounded"
        />
        <UButton
          block
          icon="hugeicons:image-upload"
          @click="replaceMode = true"
        >
          Change Image
        </UButton>
      </div>

      <div v-else class="space-y-2">
        <UFileUpload
          v-model="uploadedFile"
          accept="image/*"
          icon="hugeicons:image-upload"
          layout="list"
          label="Click to browse or drag & drop an image to upload"
          :description="
            isEditMode
              ? 'Select a new image to replace the current one.'
              : 'Image is required for a new colorway.'
          "
          :ui="{
            base: 'min-h-48',
          }"
        />
        <div class="flex gap-2">
          <UButton
            v-if="isEditMode && replaceMode"
            icon="hugeicons:link-backward"
            block
            @click="
              () => {
                uploadedFile = null
                replaceMode = false
              }
            "
          >
            Use Current Image
          </UButton>
          <UButton
            v-if="isEditMode && uploadedFile"
            icon="hugeicons:clean"
            block
            @click="
              () => {
                uploadedFile = null
              }
            "
          >
            Clear Selection
          </UButton>
        </div>
      </div>
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

const { metadata } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
})

const toast = useToast()
const route = useRoute()

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

const formats = saleFormats.filter((format) => typeof format === 'string')

const colorway = ref({
  name: '',
  img: '',
  maker_id: String(route.params.maker || ''),
  sculpt_id: String(route.params.sculpt || ''),
  maker_sculpt_id: `${String(route.params.maker || '')}/${String(route.params.sculpt || '')}`,
  order: 0,
  currency: 'USD',
  sale_type: 'Raffle',
})

const schema = z.object({
  name: z.string().nullish(),
  release: z.string().nullish(),
  qty: z.number().nullish(),
  order: z.number().nullish(),
  currency: z.enum(currencies).nullish(),
  price: z.number().nullish(),
  sale_type: z.enum(formats).nullish(),
})

const isEditMode = computed(() => Boolean(colorway.value.id))
const uploading = ref(false)
const uploadedFile = ref(null)
const replaceMode = ref(false)

onBeforeMount(() => {
  Object.assign(colorway.value, metadata)
})

const onSubmit = async () => {
  try {
    uploading.value = true

    const payload = {
      ...colorway.value,
    }

    if (uploadedFile.value) {
      payload.img = await uploadImageToCloudflare({
        file: uploadedFile.value,
        assignment: String(colorway.value.maker_id || route.params.maker || ''),
        category: 'artisan',
      })
    }

    if (!payload.img) {
      throw new Error('Please upload an image before saving this colorway.')
    }

    await $fetch(
      `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}/colorways`,
      {
        method: 'post',
        body: payload,
      },
    )

    toast.add(
      handleSuccess(
        isEditMode.value ? 'update' : 'add',
        payload.name,
        'Colorway',
      ),
    )

    replaceMode.value = false
    emit('onSuccess')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    uploading.value = false
  }
}
</script>
