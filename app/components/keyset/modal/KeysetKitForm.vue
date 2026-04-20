<template>
  <UForm :schema="schema" :state="kit" class="space-y-4" @submit="onSubmit">
    <UFormField label="Kit" name="kit_id" required>
      <UInputMenu
        :key="status"
        v-model.trim="kit.kit_id"
        :items="kits"
        :loading="status === 'pending'"
        label-key="name"
        value-key="slug"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Name" name="name" help="Leave empty for standard kits">
      <UInput
        v-model.trim="kit.name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Image" name="img">
      <UInput v-model.trim="kit.img" icon="hugeicons:image-02" class="w-full" />

      <p class="mt-2 text-xs text-muted">
        Or drag and drop an image below to upload and auto-fill this field.
      </p>

      <div class="mt-2 space-y-2">
        <UFileUpload
          v-model="uploadedFile"
          accept="image/*"
          icon="hugeicons:image-upload"
          layout="grid"
          label="Click to browse or drag & drop an image to upload"
          :description="`Maximum file size: ${maxUploadSizeMb}MB`"
          :ui="{ base: 'aspect-video' }"
        />
      </div>
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

const route = useRoute()
const toast = useToast()
const { kits, status } = useKeysetKits()

const kit = ref({
  kit_id: 'base',
  name: '',
  img: '',
  profile_keyset_id: `${route.params.profile}/${route.params.keyset}`,
  cancelled: false,
})

const uploadedFile = ref(null)
const maxUploadSizeMb = getMaxUploadSizeMb('keyset')

onBeforeMount(() => {
  Object.assign(kit.value, metadata)
})

const schema = z.object({
  kit_id: z.string(),
  name: z.string().nullish(),
  qty: z.number().nullish(),
  price: z.number().nullish(),
  img: z.url().nullish().or(z.string().min(0).max(0)),
  // description: z.string(),
  cancelled: z.boolean().catch(false),
})

const onSubmit = async () => {
  if (uploadedFile.value) {
    try {
      kit.value.img = await uploadImageToCloudflare({
        file: uploadedFile.value,
        assignment: kit.value.profile_keyset_id,
        category: 'keyset',
      })
    } catch (e) {
      toast.add(handleError(e))
      return
    }
  }

  await $fetch(`/api/keysets/${kit.value.profile_keyset_id}/kits`, {
    method: 'post',
    body: kit.value,
  })
    .then(() => {
      toast.add(handleSuccess(isEdit ? 'update' : 'add', kit.value.name, 'Kit'))

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
