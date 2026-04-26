<template>
  <UForm :schema="schema" :state="color" class="space-y-4" @submit="onSubmit">
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

    <UFormField label="Name" name="name">
      <UInput
        v-model.trim="color.name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Hex"
      name="hex"
      required
      help="Enter a valid hex color starting with # — use 3 or 6 hex digits (0-9, A-F)"
    >
      <UInput
        v-model.trim="color.hex"
        icon="hugeicons:paint-board"
        class="w-full"
      />
    </UFormField>

    <UCard
      v-if="color.hex"
      class="h-32"
      :style="{ backgroundColor: color.hex }"
    />

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
  name: z.string().nullish(),
  hex: z
    .string()
    .lowercase()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/),
})

const onSubmit = async () => {
  await $fetch(`/api/colors`, {
    method: 'post',
    body: color.value,
  })
    .then(() => {
      toast.add(
        handleSuccess(isEdit ? 'update' : 'add', color.value.name, 'Color'),
      )

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
