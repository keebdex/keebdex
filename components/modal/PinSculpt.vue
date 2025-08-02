<template>
  <UForm :schema="schema" :state="initial" class="space-y-4" @submit="onSubmit">
    <UFormField name="email">
      <USelectMenu
        v-model="initial.sculpts"
        multiple
        label-key="name"
        value-key="sculpt_id"
        :items="sculpts"
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
  sculpts: {
    type: Array,
    default: () => [],
  },
})

const route = useRoute()
const toast = useToast()
const userStore = useUserStore()
const { favorites, user } = storeToRefs(userStore)

const initial = ref({
  sculpts: favorites.value[route.params.maker] || [],
})

const schema = z.object({
  sculpts: z.string().array().max(6),
})

const onSubmit = ({ valid }) => {
  if (!valid) return

  favorites.value[route.params.maker] = initial.value.sculpts

  $fetch(`/api/users/${user.value.uid}`, {
    method: 'post',
    body: {
      favorite_makers: favorites.value,
    },
  }).then(() => {
    toast.add({
      color: 'success',
      title: 'Your pins have been updated.',
    })
    emit('onSuccess', true)
  })
}
</script>
