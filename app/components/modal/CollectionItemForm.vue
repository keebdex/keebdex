<template>
  <UForm :schema="schema" :state="item" class="space-y-4" @submit="onSubmit">
    <UFormField
      v-if="selling"
      label="Asking / Offer Price (USD)"
      name="asking_price"
    >
      <UInput
        v-model.number="item.asking_price"
        icon="hugeicons:dollar-01"
        placeholder="Type the price you want…"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="buying"
      label="Priority"
      help="Turn on to highlight this item in your collection."
    >
      <USwitch v-model="item.priority" />
    </UFormField>

    <UFormField
      label="Available"
      help="Turn on if this item is available for sale or you're looking to buy."
    >
      <USwitch v-model="item.exchange" />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import z from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, buying, selling } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  buying: Boolean,
  selling: Boolean,
})

const route = useRoute()
const toast = useToast()

const item = ref({
  asking_price: null,
  priority: false,
  exchange: true,
})

onBeforeMount(() => {
  Object.assign(item.value, metadata)
})

const schema = z.object({
  asking_price: z.number().nullish(),
  buying: z.boolean(),
  selling: z.boolean(),
})

const onSubmit = async () => {
  await $fetch(
    `/api/users/${item.value.uid}/collections/${route.params.collection}/items/${item.value.id}`,
    { method: 'post', body: item.value },
  )
    .then(() => {
      toast.add({
        color: 'success',
        title: 'Your changes have been saved.',
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
