<template>
  <UForm :schema="schema" :state="kit" class="space-y-4" @submit="onSubmit">
    <UFormField label="Kit" name="kit_id" required>
      <UInputMenu
        v-model.trim="kit.kit_id"
        :items="predefinedKits"
        label-key="name"
        value-key="id"
        icon="hugeicons:text"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Name" name="name" help="Leave empty for standard kits">
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

const predefinedKits = [
  { id: 'base', name: 'Base' },
  { id: 'alphas', name: 'Alphas' },
  { id: 'mods', name: 'Modifiers' },
  { id: 'numpad', name: 'Numpad' },
  { id: 'spacebars', name: 'Spacebars' },
  { id: 'novelties', name: 'Novelties' },
  { id: 'forties', name: '40s' },
  { id: 'ortho', name: 'Ortho' },
  { id: 'ergo', name: 'Ergo' },
  { id: 'iso', name: 'ISO' },
  { id: 'norde', name: 'NorDe' },
  { id: 'uk', name: 'UK' },
  { id: 'international', name: 'International' },
  { id: 'accent', name: 'Accents' },
  { id: 'extras', name: 'Extras' },
  { id: 'addons', name: 'Add' },
  { id: 'arrows', name: 'Arrows' },
  { id: 'relegendables', name: 'Relegendables' },
  { id: 'other', name: 'Other' },
]

const route = useRoute()
const toast = useToast()

const kit = ref({
  kit_id: 'base',
  name: '',
  img: '',
  profile_keycap_id: `${route.params.profile}/${route.params.keycap}`,
  cancelled: false,
})

onBeforeMount(() => {
  Object.assign(kit.value, metadata)
})

const schema = z.object({
  kit_id: z.string(),
  name: z.string().optional(),
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
      toast.add(handleError(error))
    })
}
</script>
