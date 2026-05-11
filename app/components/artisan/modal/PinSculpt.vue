<template>
  <UForm :schema="schema" :state="initial" class="space-y-4" @submit="onSubmit">
    <UFormField name="sculpts" required>
      <UListbox
        v-model="initial.sculpts"
        multiple
        filter
        label-key="name"
        value-key="sculpt_id"
        :items="sculpts"
        selected-icon="hugeicons:pin"
      />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { sculpts } = defineProps({
  sculpts: {
    type: Array,
    default: () => [],
  },
})

const route = useRoute()
const toast = useToast()
const userStore = useUserStore()
const { favorites, user } = storeToRefs(userStore)

const ids = sculpts.map((s) => s.sculpt_id)

const initial = ref({
  sculpts:
    favorites.value[route.params.maker].filter((id) => ids.includes(id)) || [],
})

const schema = z.object({
  sculpts: z.string().array().max(6, 'You can only pin up to 6 sculpts.'),
})

const onSubmit = async () => {
  favorites.value[route.params.maker] = initial.value.sculpts

  await $fetch(`/api/users/${user.value.uid}`, {
    method: 'post',
    body: {
      favorite_makers: favorites.value,
    },
  }).then(() => {
    emit('onSuccess')

    toast.add(handleNotice('pin_update'))
  })
}
</script>
