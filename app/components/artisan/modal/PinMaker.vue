<template>
  <UForm :schema="schema" :state="initial" class="space-y-4" @submit="onSubmit">
    <UFormField name="makers" required>
      <UListbox
        v-model="initial.makers"
        multiple
        filter
        label-key="name"
        value-key="id"
        :items="makers"
        selected-icon="hugeicons:pin"
        :ui="{
          item: 'items-center',
        }"
      >
        <template #item-leading="{ item }">
          <UAvatar
            :src="`/logo/${item.id}.png`"
            size="xs"
            :ui="{
              root: 'rounded-none bg-transparent',
              image:
                item.invertible_logo && $colorMode.value === 'dark' && 'invert',
            }"
          />
        </template>
      </UListbox>
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
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
  makers: z.string().array().max(6, 'You can only pin up to 6 makers.'),
})

const onSubmit = async () => {
  const data = initial.value.makers.reduce((out, id) => {
    out[id] = favorites.value[id] || []

    return out
  }, {})

  await $fetch(`/api/users/${user.value.uid}`, {
    method: 'post',
    body: {
      favorite_makers: data,
    },
  }).then(() => {
    toast.add(handleNotice('pin_update'))

    userStore.$patch({ favorites: data })
    emit('onSuccess')
  })
}
</script>
