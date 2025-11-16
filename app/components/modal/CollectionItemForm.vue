<template>
  <UForm :schema="schema" :state="item" class="space-y-4" @submit="onSubmit">
    <UFormField label="Asking / Offer Price (USD)" name="asking_price">
      <UInput
        v-model.number="item.asking_price"
        icon="hugeicons:dollar-01"
        placeholder="Type the price you want…"
        class="w-full"
      />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import z from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
})

const route = useRoute()
const toast = useToast()

const item = ref({
  asking_price: null,
})

onBeforeMount(() => {
  Object.assign(item.value, metadata)
})

const schema = z.object({
  asking_price: z.number().nullish(),
})

const onSubmit = async () => {
  await $fetch(
    `/api/users/${item.value.uid}/collections/${route.params.collection}/items/${item.value.id}`,
    { method: 'post', body: { asking_price: item.value.asking_price } },
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
