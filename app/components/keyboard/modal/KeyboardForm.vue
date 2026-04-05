<template>
  <UForm
    :schema="schema"
    :state="keyboard"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="keyboard.name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="!isEdit"
      label="Slug"
      name="slug"
      help="Used in URL, e.g. my-keyboard. Leave empty to auto-generate from name."
    >
      <UInput
        v-model.trim="keyboard.slug"
        icon="hugeicons:hashtag"
        placeholder="my-keyboard"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Layout" name="layout" required>
      <USelect
        v-model="keyboard.layout"
        :items="Constants.public.Enums.keyboard_layout"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Typing Angle" name="typing_angle">
      <UInput
        v-model.number="keyboard.typing_angle"
        type="number"
        step="0.1"
        icon="hugeicons:angle-01"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="keyboard.description" :rows="5" class="w-full" />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto>Save</UButton>
  </UForm>
</template>

<script setup>
import slugify from 'slugify'
import { Constants } from '~/types/database.types'
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit, brandSlug } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
  brandSlug: {
    type: String,
    required: true,
  },
})

const toast = useToast()

const keyboard = ref({
  name: '',
  slug: '',
  layout: Constants.public.Enums.keyboard_layout[0],
  typing_angle: null,
})

const schema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens only',
    )
    .nullish()
    .or(z.string().min(0).max(0)),
  layout: z.enum(Constants.public.Enums.keyboard_layout),
  typing_angle: z.coerce.number().min(0).max(30).nullish(),
})

onBeforeMount(() => {
  Object.assign(keyboard.value, metadata || {})
})

const onSubmit = async () => {
  const slug = isEdit
    ? String(metadata?.slug || keyboard.value.slug || '').trim()
    : String(keyboard.value.slug || '').trim() ||
      slugify(keyboard.value.name, { lower: true })

  await $fetch(`/api/keyboards/${brandSlug}/${slug}`, {
    method: 'post',
    body: {
      ...keyboard.value,
      slug,
      brand_slug: brandSlug,
    },
  })
    .then((data) => {
      toast.add(
        handleSuccess(
          isEdit ? 'update' : 'add',
          keyboard.value.name,
          'Keyboard',
        ),
      )
      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
