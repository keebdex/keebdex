<template>
  <UForm :schema="schema" :state="initial" class="space-y-4" @submit="onSubmit">
    <UFormField name="email">
      <USelectMenu
        v-model="initial.makers"
        multiple
        label-key="name"
        value-key="id"
        :items="makers"
        class="w-full"
        selected-icon="hugeicons:pin"
      />
    </UFormField>

    <UButton color="primary" type="submit"> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

defineProps({
  makers: {
    type: Array,
    default: () => [],
  },
})

const toast = useToast()
const userStore = useUserStore()
const { favorites, user } = storeToRefs(userStore)

const initial = ref({
  makers: Object.keys(favorites.value) || [],
})

const schema = z.object({
  makers: z.string().array().max(6),
})

const onSubmit = ({ valid }) => {
  if (!valid) return

  const data = initial.value.makers.reduce((out, id) => {
    out[id] = favorites.value[id] || []

    return out
  }, {})

  $fetch(`/api/users/${user.value.uid}`, {
    method: 'post',
    body: {
      favorite_makers: data,
    },
  }).then(() => {
    toast.add({
      color: 'success',
      title: 'Your pins have been updated.',
    })

    userStore.$patch({ favorites: data })
    emit('onSuccess', true)
  })
}
</script>
