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
        icon="hugeicons:text"
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
      help="Please ensure the image is square (e.g., 1:1 aspect ratio) and focused closely on the keycap for the best display. Avoid excessive background or blurry shots."
    >
      <UFileUpload
        v-model="uploadedFiles"
        disabled
        icon="hugeicons:image-upload"
        layout="list"
        label="Click to browse or drag & drop an image to upload"
        :ui="{
          base: 'min-h-48',
        }"
      />
    </UFormField>
    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
})

const toast = useToast()

const currencies = ['USD', 'EUR', 'CAD', 'SGD', 'MYR', 'CNY', 'VND']

const specialFormats = ['Giveaway', 'Commission', 'Auction']
const saleFormats = [
  {
    type: 'label',
    label: 'Standard',
  },
  'Raffle',
  'FCFS',
  'Fulfillment',
  {
    type: 'separator',
  },
  {
    type: 'label',
    label: 'Special',
  },
  ...specialFormats,
]

const formats = saleFormats.filter((f) => !f.type)

const route = useRoute()
const colorway = ref({
  name: '',
  img: '',
})

const schema = z.object({
  name: z.string().nullish(),
  release: z.string().nullish(),
  qty: z.number().nullish(),
  order: z.number(),
  currency: z.enum(currencies).nullish(),
  price: z.number().nullish(),
  sale_type: z.enum(formats).nullish(),
  // description: z.string().nullish(),
  // img: z.string().url(),
})

const uploadedFiles = ref([])

onBeforeMount(() => {
  Object.assign(colorway.value, metadata)
})

onMounted(async () => {
  const file = await fetchFileFromUrl(colorway.value.img, 'image.jpg')
  uploadedFiles.value = [file]
})

async function fetchFileFromUrl(url, filename) {
  const res = await fetch(url)

  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type })
}

const onSubmit = async () => {
  await $fetch(
    `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}/colorways`,
    {
      method: 'post',
      body: colorway.value,
    },
  )
    .then(() => {
      toast.add({
        color: 'success',
        title: `Colorway [${colorway.value.name}] has been updated successfully.`,
      })

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add({
        color: 'error',
        title: 'Oops! Something went wrong',
        description: error.message,
      })
    })
}
</script>
