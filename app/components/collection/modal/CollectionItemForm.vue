<template>
  <UForm :schema="schema" :state="item" class="space-y-4" @submit="onSubmit">
    <UFormField
      :label="buying ? 'Still Looking' : 'Available'"
      :help="
        buying
          ? 'Turn off once you have it. It stays here, marked as found, and leaves your Trading Hub listing.'
          : 'Turn off once it is sold or traded. It stays here, marked as gone, and leaves your Trading Hub listing.'
      "
    >
      <USwitch v-model="item.exchange" />
    </UFormField>

    <UFormField
      v-if="item.exchange"
      :label="buying ? 'Offer Price (USD)' : 'Asking Price (USD)'"
      name="asking_price"
    >
      <UInput
        v-model.number="item.asking_price"
        icon="hugeicons:dollar-01"
        :placeholder="buying ? 'What you would pay' : 'What you want for it'"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="buying"
      label="Priority"
      help="Highlights it on this page, in the Trading Hub, and in your wishlist image."
    >
      <USwitch v-model="item.priority" :disabled="!item.exchange" />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto>
      Save Changes
    </UButton>
  </UForm>
</template>

<script setup>
import z from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, buying } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  // Wishlist collection; otherwise a for-sale-or-trade collection
  buying: Boolean,
})

const route = useRoute()
const toast = useToast()

const item = ref({
  asking_price: null,
  priority: false,
  exchange: true,
})

watch(
  () => item.value.exchange,
  (newValue) => {
    if (!newValue) {
      item.value.priority = false
    }
  },
)

onBeforeMount(() => {
  Object.assign(item.value, metadata)
})

const schema = z.object({
  asking_price: z.preprocess(
    (value) => (value === '' ? null : value),
    z.number().nullish(),
  ),
})

const onSubmit = async () => {
  const { asking_price } = schema.parse(item.value)
  const { priority, exchange } = item.value

  await $fetch(
    `/api/users/${item.value.uid}/collections/${route.params.collection}/items/${item.value.id}`,
    { method: 'post', body: { asking_price, exchange, priority } },
  )
    .then(() => {
      toast.add(successToast('update', { entity: 'Collection item' }))

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
}
</script>
