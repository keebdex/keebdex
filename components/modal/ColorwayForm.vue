<template>
  <Form
    v-slot="$form"
    :initial-values="colorway"
    :resolver
    class="flex flex-col gap-6"
    @submit="onSubmit"
  >
    <div class="flex flex-col gap-2">
      <label for="colorway_name">Name</label>
      <InputText
        id="colorway_name"
        v-model.trim="colorway.name"
        name="name"
        type="text"
      />
      <Message
        v-if="$form.name?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ $form.name.error.message }}
      </Message>
    </div>

    <div class="grid grid-cols-4 gap-2">
      <div class="col-span-2 flex flex-col gap-2">
        <label for="colorway_release">Release</label>
        <InputText
          id="colorway_release"
          v-model.trim="colorway.release"
          name="release"
          type="text"
        />
        <Message
          v-if="$form.release?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.release.error.message }}
        </Message>
      </div>
      <div class="col-span-1 flex flex-col gap-2">
        <label for="colorway_qty">Quantity</label>
        <InputNumber
          v-model.number="colorway.qty"
          input-id="colorway_qty"
          name="qty"
          :use-grouping="false"
          fluid
        />
        <Message
          v-if="$form.qty?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.qty.error.message }}
        </Message>
      </div>
      <div class="col-span-1 flex flex-col gap-2">
        <label for="colorway_order">Order</label>
        <InputNumber
          v-model.number="colorway.order"
          input-id="colorway_order"
          name="order"
          :use-grouping="false"
          fluid
        />
        <Message
          v-if="$form.order?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.order.error.message }}
        </Message>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="flex flex-col gap-2">
        <label for="colorway_sale_type">Sale Type</label>
        <Select
          id="colorway_sale_type"
          v-model="colorway.sale_type"
          name="sale_type"
          option-group-label="label"
          option-group-children="items"
          :options="groupedFormats"
        />
      </div>
      <div v-if="colorway.sale_type !== 'Giveaway'" class="flex flex-col gap-2">
        <label for="colorway_price">Price</label>
        <InputGroup>
          <Select
            v-model="colorway.currency"
            name="currency"
            :options="currencies"
          />
          <InputNumber
            v-model="colorway.price"
            v-keyfilter.money
            input-id="colorway_price"
            name="price"
            :use-grouping="false"
          />
          <Message
            v-if="$form.price?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.price.error.message }}
          </Message>
        </InputGroup>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label for="colorway_desc">Description</label>
      <Textarea
        id="colorway_desc"
        v-model.trim="colorway.description"
        name="description"
        :rows="5"
        auto-resize
      />
      <Message severity="secondary" size="small" variant="simple">
        Keep it concise and under 400 characters for optimal display.
      </Message>
    </div>
    <div class="flex flex-col gap-2">
      <label for="colorway_story">Image</label>
      <FileUpload name="demo[]" :multiple="false" accept="image/*" disabled>
        <template #empty>
          <span>Drop files here to upload or click to select.</span>
        </template>
      </FileUpload>
    </div>
    <div class="flex flex-col gap-2">
      <Button label="Save" type="submit" :disabled="!$form.valid" />
    </div>

    <Toast />
  </Form>
</template>

<script setup>
import { zodResolver } from '@primevue/forms/resolvers/zod'
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

const groupedFormats = [
  {
    label: 'Standard',
    items: ['Raffle', 'FCFS', 'Fulfillment'],
  },
  {
    label: 'Special',
    items: ['Giveaway', 'Commission', 'Auction'],
  },
]

const formats = groupedFormats.map((g) => g.items).flat()

const route = useRoute()
const colorway = ref({
  name: '',
  img: '',
})

const resolver = ref(
  zodResolver(
    z.object({
      name: z.string().nullish(),
      release: z.string().nullish(),
      qty: z.number().nullish(),
      order: z.number(),
      currency: z.enum(currencies).nullish(),
      price: z.number().nullish(),
      sale_type: z.enum(formats).nullish(),
      // description: z.string().nullish(),
      // img: z.string().url(),
    }),
  ),
)

onBeforeMount(() => {
  Object.assign(colorway.value, metadata)
})

const onSubmit = async ({ valid }) => {
  if (!valid) return

  $fetch(
    `/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}/colorways`,
    {
      method: 'post',
      body: colorway.value,
    },
  )
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Colorway updated successfully!',
        life: 3000,
      })
      emit('onSuccess', undefined, true)
    })
    .catch((error) => {
      toast.add({ severity: 'error', summary: error.message, life: 3000 })
    })
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
