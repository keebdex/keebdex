<template>
  <UForm :schema :state="collection" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput v-model="collection.name" class="w-full" />
    </UFormField>

    <UFormField label="Category" name="category">
      <USelect
        v-model="collection.category"
        :items="categoryItems"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="collection.category === 'artisan'"
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
      />
    </UFormField>

    <UFormField
      v-if="collection.category === 'artisan'"
      label="Sorting"
      name="sorting"
    >
      <URadioGroup
        v-model="collection.sort_by"
        :items="[
          {
            label: 'Sculpt Name',
            description: 'Sort by sculpt artist name, then by colorway name',
            icon: appConfig.ui.icons.sortAlphaAsc,
            value: 'artisan.maker_sculpt_id|artisan.name',
          },
          {
            label: 'Colorway Name',
            description: 'Sort by colorway name, then by sculpt artist name',
            icon: appConfig.ui.icons.sortAlphaDesc,
            value: 'artisan.name|artisan.maker_sculpt_id',
          },
          {
            label: 'Custom Order',
            description: 'Sort manually using drag-and-drop',
            icon: appConfig.ui.icons.sortNumberAsc,
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
import { Constants } from '~/types/database.types'
import { z } from 'zod'

const appConfig = useAppConfig()

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit } = defineProps({
  metadata: { type: Object, default: () => ({}) },
  isEdit: Boolean,
})

const userStore = useUserStore()
const toast = useToast()

const { user } = storeToRefs(userStore)

const intentExtras = {
  keep: 'Just holding onto it for now.',
  want: 'On the hunt! Any leads appreciated!',
  sell: 'Open to offers — but it needs to be the right fit.',
}

const categoryItems = Constants.public.Enums.module.map((value) => ({
  label: value,
  value: value.toLowerCase(),
  disabled: isEdit,
}))

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
  uid: user.value.uid,
})

onBeforeMount(() => {
  const { items, ...rest } = metadata
  Object.assign(collection.value, rest)
})

watch(
  () => collection.value.category,
  (category) => {
    if (category !== 'artisan') {
      collection.value.intent = 'keep'
      collection.value.sort_by = 'order|asc'
    }
  },
  { immediate: true },
)

const schema = z
  .object({
    name: z.string().min(1),
    category: z.enum(categoryItems.map((item) => item.value)),
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
    ? `/api/users/${user.value.uid}/collections/${rest.id}`
    : `/api/users/${user.value.uid}/collections`

  await $fetch(url, { method: 'post', body: rest })
    .then(() => {
      toast.add(
        handleSuccess(isEdit ? 'update' : 'add', rest.name, 'Collection'),
      )

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error))
    })

  await userStore.fetchUserCollections(user.value.uid)
}
</script>
