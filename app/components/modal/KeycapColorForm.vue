<template>
  <UForm :schema="schema" :state="color" class="space-y-4" @submit="onSubmit">
    <UFormField name="name" help="Type to search colors…" required>
      <UInputMenu
        v-model="selectedColors"
        v-model:search-term="term"
        multiple
        :items="data.colors"
        :loading="status === 'pending'"
        ignore-filter
        icon="hugeicons:paint-board"
        placeholder="Which color are you looking for?"
        label-key="name"
        class="w-full"
      >
        <template #item-leading="{ item }">
          <UAvatar :style="{ backgroundColor: item.hex }" />
        </template>
      </UInputMenu>
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const route = useRoute()
const toast = useToast()

const term = ref('')
const query = computed(() => {
  return {
    term: term.value,
  }
})

const { data, status } = await useAsyncData(
  route.path,
  () =>
    $fetch('/api/colors', {
      query: query.value,
    }),
  { watch: [term] },
)

const selectedColors = ref([])

const color = computed(() => {
  return {
    profile_keycap_id: `${route.params.profile}/${route.params.keycap}`,
    color_ids: selectedColors.value.map((c) => c.id),
  }
})

const schema = z.object({
  profile_keycap_id: z.string(),
  color_ids: z.number().array().min(1),
})

const onSubmit = async () => {
  await $fetch(`/api/keycaps/${color.value.profile_keycap_id}/colors`, {
    method: 'post',
    body: color.value,
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: 'Keycap colors added successfully!',
      })
      emit('onSuccess')
    })
    .catch((error) => {
      console.error(error)
      toast.add({ color: 'error', title: error.message })
    })
}
</script>
