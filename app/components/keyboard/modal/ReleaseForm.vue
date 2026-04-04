<template>
  <UForm :schema="schema" :state="release" class="space-y-4" @submit="onSubmit">
    <UFormField label="Label" name="label">
      <UInput
        v-model.trim="release.label"
        icon="hugeicons:tag-01"
        placeholder="e.g. Round 1"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Release Year" name="release_year">
      <UInput
        v-model.number="release.release_year"
        type="number"
        icon="hugeicons:calendar-03"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Mount Style" name="mount_style">
      <USelect
        v-model="release.mount_style"
        :items="Constants.public.Enums.keyboard_mounting_style"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Typing Angle" name="typing_angle">
      <UInput
        v-model.number="release.typing_angle"
        type="number"
        step="0.1"
        icon="hugeicons:curve-point"
        class="w-full"
      />
    </UFormField>

    <UFormField label="PCB Types" name="pcb_types">
      <USelectMenu
        v-model="release.pcb_types"
        :items="Constants.public.Enums.keyboard_pcb_type"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Case Material" name="case_material">
      <UInput
        v-model.trim="release.case_material"
        icon="hugeicons:cube"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="release.description" :rows="5" class="w-full" />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto>Save</UButton>
  </UForm>
</template>

<script setup>
import { Constants } from '~/types/database.types'
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit, brandSlug, keyboardSlug } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
  brandSlug: {
    type: String,
    required: true,
  },
  keyboardSlug: {
    type: String,
    required: true,
  },
})

const toast = useToast()

const release = ref({
  label: '',
  description: '',
  release_year: null,
  mount_style: null,
  pcb_types: [],
  typing_angle: null,
  case_material: '',
})

const schema = z.object({
  label: z.string().nullish().or(z.string().min(0).max(0)),
  release_year: z.coerce.number().min(1900).max(2100).nullish(),
  mount_style: z.enum(Constants.public.Enums.keyboard_mounting_style).nullish(),
  typing_angle: z.coerce.number().min(0).max(30).nullish(),
  pcb_types: z
    .array(z.enum(Constants.public.Enums.keyboard_pcb_type))
    .nullish(),
  case_material: z.string().nullish().or(z.string().min(0).max(0)),
  description: z.string().max(400).nullish().or(z.string().min(0).max(0)),
})

onBeforeMount(() => {
  Object.assign(release.value, metadata || {})
})

const onSubmit = async () => {
  await $fetch(`/api/keyboards/${brandSlug}/${keyboardSlug}/releases`, {
    method: 'post',
    body: release.value,
  })
    .then((data) => {
      toast.add(
        handleSuccess(
          isEdit ? 'update' : 'add',
          release.value.label || 'Release',
          'Release',
        ),
      )
      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
