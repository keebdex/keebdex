<template>
  <UForm
    :schema="collectionSchema"
    :state="collection"
    class="space-y-4"
    @submit="onSubmit"
  >
    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Name" name="name" required>
        <UInput
          v-model="collection.name"
          placeholder="e.g. Grails, Desk Shelf"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Category" name="category">
        <USelect
          v-model="collection.category"
          :items="categoryItems"
          :disabled="isEdit || lockCategory"
          value-key="value"
          class="w-full"
        />
      </UFormField>
    </div>

    <template v-if="isArtisan">
      <UFormField label="What's This Collection For?" name="intent">
        <URadioGroup
          v-model="collection.intent"
          variant="table"
          :items="collectionIntentItems"
        />
      </UFormField>

      <UFormField label="Sort Order" name="sort_by">
        <URadioGroup
          v-model="collection.sort_by"
          variant="table"
          :items="sortItems"
        />
      </UFormField>
    </template>

    <template v-if="listable">
      <USeparator label="Trading Hub Listing" />

      <p class="text-sm text-muted">
        Shown in the Trading Hub once you make this collection public from
        <span class="font-medium text-default">Share</span> on its page.
      </p>

      <UFormField
        label="Discord Username"
        name="contact"
        required
        help="Buyers and sellers will contact you here."
      >
        <UInput
          v-model.trim="collection.contact"
          icon="hugeicons:discord"
          placeholder="username"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Message" name="message">
        <UTextarea
          v-model="collection.message"
          :rows="2"
          autoresize
          :placeholder="messagePlaceholder"
          class="w-full"
        />
      </UFormField>
    </template>

    <UButton block color="primary" type="submit" loading-auto>
      {{ isEdit ? 'Save Changes' : 'Create Collection' }}
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import { Constants } from '~/types/database.types'
import {
  collectionSchema,
  type CollectionIntent,
} from '~/utils/schemas/collection'

type CollectionState = {
  id?: string
  name: string
  category: string
  intent: CollectionIntent
  sort_by: string
  contact: string | null
  message: string | null
}

const emit = defineEmits<{ onSuccess: [] }>()

const {
  metadata = {},
  isEdit = false,
  lockCategory = false,
} = defineProps<{
  metadata?: Record<string, any>
  isEdit?: boolean
  // Fixed when the form is opened for a specific kind of item, e.g. Save
  lockCategory?: boolean
}>()

const userStore = useUserStore()
const toast = useToast()

const { user, social } = storeToRefs(userStore)

// The user store is plain JavaScript, so its state carries no field types
const uid = computed(() => (user.value as { uid?: string }).uid)
const discord = computed(
  () => (social.value as { discord?: string | null }).discord || null,
)

const categoryItems = Constants.public.Enums.module.map((value) => ({
  label: value,
  value: value.toLowerCase(),
}))

const sortItems = [
  {
    label: 'Maker & Sculpt',
    description: 'Grouped by maker, then sculpt, then colorway name.',
    value: 'artisan.maker_sculpt_id|artisan.name',
  },
  {
    label: 'Colorway Name',
    description: 'Grouped by maker, then colorway name, then sculpt.',
    value: 'artisan.name|artisan.maker_sculpt_id',
  },
  {
    label: 'Custom Order',
    description:
      'Your own order, arranged with Manual Sort on the collection page.',
    value: 'order|asc',
  },
]

const collection = ref<CollectionState>({
  name: '',
  category: 'artisan',
  intent: 'keep',
  sort_by: 'artisan.maker_sculpt_id|artisan.name',
  contact: discord.value,
  message: null,
})

onBeforeMount(() => {
  const { items: _items, ...rest } = metadata
  Object.assign(collection.value, rest)
  // Older rows may have no contact yet; offer the profile's Discord
  collection.value.contact ||= discord.value
})

// The profile can finish loading after the form opens
watch(discord, (value) => {
  collection.value.contact ||= value
})

const isArtisan = computed(() => collection.value.category === 'artisan')
const listable = computed(
  () => isArtisan.value && collection.value.intent !== 'keep',
)

const messagePlaceholder = computed(() =>
  collection.value.intent === 'want'
    ? 'e.g. Paying in USD, can add caps from my sale list to sweeten trades.'
    : 'e.g. Prices include shipping in the US, open to trades for my wishlist.',
)

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

const onSubmit = async () => {
  const { id, name } = collection.value
  const body = collectionSchema.parse(collection.value)

  const url = isEdit
    ? `/api/users/${uid.value}/collections/${id}`
    : `/api/users/${uid.value}/collections`

  try {
    await $fetch(url, {
      method: 'POST',
      body: isEdit ? body : { ...body, published: false },
    })

    toast.add(
      successToast(isEdit ? 'update' : 'add', {
        entity: 'Collection',
        name: name.trim(),
      }),
    )

    await userStore.fetchUserCollections(uid.value)
    emit('onSuccess')
  } catch (error) {
    toast.add(errorToast(error))
  }
}
</script>
