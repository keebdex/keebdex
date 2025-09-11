<template>
  <UForm :schema :state="collection" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput v-model="collection.name" class="w-full" />
    </UFormField>

    <UFormField label="Category" name="category">
      <URadioGroup
        v-model="collection.category"
        orientation="horizontal"
        :items="[
          { label: 'Artisan', value: 'artisan', disabled: isEdit },
          { label: 'Keycap', value: 'keycap', disabled: isEdit },
        ]"
        :ui="{ fieldset: 'gap-x-4' }"
      />
    </UFormField>

    <UFormField
      label="Visibility"
      name="published"
      :help="
        collection.published
          ? 'Anyone can now discover your collection publicly.'
          : 'Keeping it private means only you can see it.'
      "
    >
      <URadioGroup
        v-model="collection.published"
        orientation="horizontal"
        :items="[
          { label: 'Private', value: false },
          { label: 'Public', value: true },
        ]"
        :ui="{ fieldset: 'gap-x-4' }"
      />
    </UFormField>

    <UFormField
      label="Intent"
      name="intent"
      :help="intentExtras[collection.intent]"
    >
      <URadioGroup
        v-model="collection.intent"
        orientation="horizontal"
        :items="[
          { label: 'Keep', value: 'keep' },
          { label: 'Want', value: 'want' },
          { label: 'Sell/Trade', value: 'sell' },
        ]"
        :ui="{ fieldset: 'gap-x-4' }"
      />
    </UFormField>

    <UFormField label="Sorting" name="sorting">
      <URadioGroup
        v-model="collection.sort_by"
        :items="[
          {
            label: 'Sculpt Name',
            description: 'Sort by sculpt artist name, then by colorway name',
            icon: 'hugeicons:sorting-a-z-02',
            value: 'artisan.maker_sculpt_id|artisan.name',
          },
          {
            label: 'Colorway Name',
            description: 'Sort by colorway name, then by sculpt artist name',
            icon: 'hugeicons:sorting-a-z-02',
            value: 'artisan.name|artisan.maker_sculpt_id',
          },
          {
            label: 'Custom Order',
            description: 'Sort manually using drag-and-drop',
            icon: 'hugeicons:sort-by-down-01',
            value: 'order|asc',
          },
        ]"
      />
    </UFormField>

    <UFormField
      v-if="collection.published && collection.intent !== 'keep'"
      label="Contact"
      name="contact"
      help="Enter your Discord username so buyers/sellers can reach you."
    >
      <UInput v-model="collection.contact" type="text" class="w-full" />
    </UFormField>

    <UFormField
      v-if="collection.published && collection.intent !== 'keep'"
      label="Message"
      name="message"
      help="Describe what you're offering or what kind of offers you're looking for."
    >
      <UInput v-model="collection.message" type="text" class="w-full" />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, uid, isEdit } = defineProps({
  metadata: { type: Object, default: () => ({}) },
  isEdit: Boolean,
  uid: String,
})

const userStore = useUserStore()
const toast = useToast()

const intentExtras = {
  keep: 'Just holding onto it for now.',
  want: 'On the hunt! Any leads appreciated!',
  sell: 'Open to offers — but it needs to be the right fit.',
}

const sortOptions = [
  'artisan.maker_sculpt_id|artisan.name',
  'artisan.name|artisan.maker_sculpt_id',
  'order|asc',
]

const collection = ref({
  name: '',
  category: 'artisan',
  published: false,
  intent: 'keep',
  sort_by: 'artisan.maker_sculpt_id|artisan.name',
  contact: null,
  message: null,
  uid,
})

onBeforeMount(() => {
  const { items, ...rest } = metadata
  Object.assign(collection.value, rest)
})

const schema = z
  .object({
    name: z.string().min(1),
    category: z.enum(['artisan', 'keycap']),
    published: z.boolean(),
    sort_by: z.enum(sortOptions),
    intent: z.enum(['keep', 'want', 'sell']),
    contact: z.string().optional().nullable(),
    message: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (
        data.published &&
        (data.intent === 'want' || data.intent === 'sell')
      ) {
        return !!data.contact
      }
      return true
    },
    {
      message: 'Contact is required for public buy/sell collections.',
      path: ['contact'],
    },
  )

const onSubmit = async () => {
  const { items, ...rest } = collection.value

  const url = isEdit
    ? `/api/users/${uid}/collections/${rest.id}`
    : `/api/users/${uid}/collections`

  await $fetch(url, { method: 'post', body: rest })
    .then(() => {
      toast.add({
        color: 'success',
        title: `Collection [${rest.name}] ${isEdit ? 'updated' : 'added'} successfully!`,
      })

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })

  await userStore.fetchUserCollections(uid)
}
</script>
