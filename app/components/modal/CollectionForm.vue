<template>
  <UForm :schema :state="collection" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput v-model="collection.name" class="w-full" />
    </UFormField>

    <UFormField label="Category" name="category">
      <UTabs
        v-model="collection.category"
        size="sm"
        :items="[
          { label: 'Artisan', value: 'artisan', disabled: isEdit },
          { label: 'Keycap', value: 'keycap', disabled: isEdit },
        ]"
      />
    </UFormField>

    <UFormField
      label="Visibility"
      name="visibility"
      :help="
        collection.published
          ? 'Anyone can now discover the treasures you\'ve assembled in this public collection.'
          : 'Choosing private keeps this collection under lock and key, hidden from prying eyes.'
      "
    >
      <UTabs
        v-model="collection.published"
        size="sm"
        :items="[
          { label: 'Private', value: false },
          { label: 'Public', value: true },
        ]"
      />
    </UFormField>

    <UFormField label="Type" name="type" :help="typeExtras[collection.type]">
      <UTabs
        v-model="collection.type"
        size="sm"
        :items="
          collection.published
            ? [
                { label: 'Shareable', value: 'shareable' },
                { label: 'To Buy', value: 'to_buy' },
                { label: 'For Sale', value: 'for_sale' },
              ]
            : [
                { label: 'Personal Use', value: 'personal' },
                { label: 'Future Buy', value: 'personal_buy' },
                { label: 'Future Sale', value: 'personal_sell' },
              ]
        "
      />
    </UFormField>

    <UFormField
      v-if="collection.published && collection.type !== 'shareable'"
      label="Contact"
      name="contact"
      help="Please enter your Discord username so that buyer/seller can reach you
        directly."
    >
      <UInput v-model="collection.contact" type="contact" class="w-full" />
    </UFormField>

    <UFormField
      v-if="collection.published && collection.type !== 'shareable'"
      label="Message"
      name="message"
      help="Describe what you're offering and/or help others understand what types
        of offers you are looking for. Your message should be applicable to many
        people using the marketplace, not just a specific person."
    >
      <UInput v-model="collection.message" type="contact" class="w-full" />
    </UFormField>

    <UButton color="primary" type="submit"> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, uid, isEdit } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
  // eslint-disable-next-line vue/require-default-prop
  uid: String,
})

const userStore = useUserStore()
const toast = useToast()

const typeExtras = {
  personal: 'Just holding onto it for now.',
  personal_buy: 'Looking to add to your collection. Got anything?',
  personal_sell: 'Open to offers, but it needs to be the right fit.',
  shareable: 'Exclusive, just for you (and your friends) via link.',
  to_buy: 'On the hunt! Any leads appreciated!',
  for_sale: 'Up for grabs!',
}

const collection = ref({
  name: '',
  category: 'artisan',
  published: false,
  type: 'personal',
  uid,
})

onBeforeMount(() => {
  Object.assign(collection.value, metadata)
})

watch(
  () => collection.value.published,
  () => {
    if (collection.value.published) {
      collection.value.type = 'shareable'
    } else {
      collection.value.type = 'personal'
    }
  },
)

const personalOrSharable = z.object({
  name: z.string().min(1),
  category: z.enum(['artisan', 'keycap']),
  published: z.boolean(),
  type: z.enum(['shareable', 'personal', 'personal_buy', 'personal_sell']),
  contact: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
})

const trading = z.object({
  name: z.string().min(1),
  category: z.enum(['artisan', 'keycap']),
  published: z.boolean(),
  type: z.enum(['to_buy', 'for_sale']),
  contact: z.string().min(1),
  message: z.string().optional().nullable(),
})

const schema = z.discriminatedUnion('type', [personalOrSharable, trading])

const onSubmit = async () => {
  const { items, ...rest } = collection.value

  const url = isEdit
    ? `/api/users/${uid}/collections/${rest.id}`
    : `/api/users/${uid}/collections`

  await $fetch(url, {
    method: 'post',
    body: rest,
  })
    .then(() => {
      if (isEdit) {
        toast.add({
          color: 'success',
          title: `Collection [${rest.name}] updated successfully!`,
        })
        emit('onSuccess')
      } else {
        toast.add({
          color: 'success',
          title: `Collection [${rest.name}] added successfully!`,
        })
        emit('onSuccess')
      }
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })

  await userStore.fetchUserCollections(uid)
}
</script>
