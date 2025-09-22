<template>
  <UForm :schema="schema" :state="kit" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput v-model.trim="kit.name" icon="hugeicons:text" class="w-full" />
    </UFormField>

    <UFormField label="Image" name="img">
      <UInput v-model.trim="kit.img" icon="hugeicons:image-02" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Price" name="price">
        <UInput
          v-model.number="kit.price"
          icon="hugeicons:sale-tag-02"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Quantity" name="quantity">
        <UInput
          v-model.number="kit.qty"
          icon="hugeicons:text-number-sign"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="kit.description" :rows="5" class="w-full" />
    </UFormField>

    <UFormField>
      <UCheckbox v-model="kit.cancelled" label="Cancelled" />
    </UFormField>

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

// const predefinedKits = [
//   'Base',
//   'Novelties',
//   'Spacebars',
//   'Alphas',
//   'Modifiers',
//   '40s',
//   'Numpad',
//   'Extension',
//   'Addons',
//   'Accents',
//   'Hiragana',
//   'Katakana',
//   'Hangul',
//   'Cyrillic',
//   'NorDe',
//   'NorDeUK',
//   'Forties',
//   'ISO',
//   'Colevrak',
//   '40s/Ortho',
//   'International',
// ]

const route = useRoute()
const toast = useToast()

const kit = ref({
  name: '',
  img: '',
  profile_keycap_id: `${route.params.profile}/${route.params.keycap}`,
  cancelled: false,
})

onBeforeMount(() => {
  Object.assign(kit.value, metadata)
})

const schema = z.object({
  name: z.string().min(1),
  qty: z.number().nullish(),
  price: z.number().nullish(),
  img: z.url().nullish().or(z.string().min(0).max(0)),
  // description: z.string(),
  cancelled: z.boolean().catch(false),
})

const onSubmit = async () => {
  await $fetch(`/api/keycaps/${kit.value.profile_keycap_id}/kits`, {
    method: 'post',
    body: kit.value,
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: `Kit [${kit.value.name}] has been ${isEdit ? 'updated' : 'added'} successfully.`,
      })

      emit('onSuccess')
    })
    .catch((error) => {
      console.error(error)
      toast.add({
        color: 'error',
        title: 'Oops! Something went wrong',
        description: error.message,
      })
    })
}
</script>
