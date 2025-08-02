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

      <UFormField label="Price" name="price">
        <UButtonGroup>
          <USelect v-model="colorway.currency" :items="currencies" />
          <UInput v-model.number="colorway.price" />
        </UButtonGroup>
      </UFormField>
    </div>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="colorway.description" :rows="5" class="w-full" />
    </UFormField>

    <UFormField label="Image" name="img">
      <UPageCard orientation="horizontal">
        <NuxtImg
          :alt="colorway.name"
          :src="colorway.img"
          class="w-full h-full object-cover"
        />
        <UInput type="file" disabled @change="onFileChange" />
      </UPageCard>
    </UFormField>
    <UButton color="primary" type="submit"> Save </UButton>
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
  'Giveaway',
  'Commission',
  'Auction',
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

onBeforeMount(() => {
  Object.assign(colorway.value, metadata)
})

const onSubmit = async () => {
  $fetch(
    `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}/colorways`,
    {
      method: 'post',
      body: colorway.value,
    },
  )
    .then(() => {
      toast.add({
        color: 'success',
        title: 'Colorway updated successfully!',
      })
      emit('onSuccess', undefined, true)
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}

function onFileChange(e) {
  const input = e.target

  if (!input.files?.length) {
    return
  }

  colorway.value.img = URL.createObjectURL(input.files[0])
}

// const fetching = ref(false)
// const keycaps = ref([])
// const fetchkeycaps = (val) => {
//   fetching.value = true
//   $fetch(`/api/keycaps?query=${val}`)
//     .then((data) => {
//       keycaps.value = data.map((k) => ({ key: k.id, value: k.name }))
//       fetching.value = false
//     })
//     .catch(() => {
//       fetching.value = false
//     })
// }
</script>
