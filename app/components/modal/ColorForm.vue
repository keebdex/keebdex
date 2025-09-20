<template>
  <UForm :schema="schema" :state="code" class="space-y-4" @submit="onSubmit">
    <UFormField label="System" name="system" required>
      <USelect v-model="color.system" :items="colorSystems" class="w-full" />
    </UFormField>

    <UFormField label="Code" name="code" required>
      <UInput
        v-model.trim="color.code"
        icon="hugeicons:tag-01"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Name" name="name" required>
      <UInput v-model.trim="color.name" icon="hugeicons:text" class="w-full" />
    </UFormField>

    <div class="flex flex-col gap-4">
      <UFormField label="Hex" name="hex" required>
        <UInput
          v-model.trim="color.hex"
          icon="hugeicons:paint-board"
          class="w-full"
        >
          <template #trailing>
            <UAvatar :style="{ backgroundColor: color.hex }" size="xs" />
          </template>
        </UInput>
      </UFormField>
    </div>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
})

const toast = useToast()

const color = ref({
  name: '',
})

onBeforeMount(() => {
  Object.assign(color.value, metadata)
})

const colorSystems = ['GMK', 'SP', 'Pantone', 'RAL']

const schema = z.object({
  system: z.enum(colorSystems),
  code: z.string().min(1),
  name: z.string().min(1),
  hex: z.string().length(7),
})

const onSubmit = async () => {
  await $fetch(`/api/colors/${color.value.id}`, {
    method: 'post',
    body: color.value,
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: `Color [${color.value.name}] ${isEdit ? 'updated' : 'added'} successfully!`,
      })

      emit('onSuccess')
    })
    .catch((error) => {
      console.error(error)
      toast.add({ color: 'error', title: error.message })
    })
}
</script>
