<template>
  <UForm
    :schema="brandSchema"
    :state="brand"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="brand.name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="!isEdit"
      label="Slug"
      name="slug"
      help="Used in URL, e.g. my-brand. Leave empty to auto-generate from name."
    >
      <UInput
        v-model.trim="brand.slug"
        icon="hugeicons:hashtag"
        placeholder="my-brand"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Country" name="country_origin">
      <USelectMenu
        v-model="brand.country_origin"
        :items="country"
        label-key="name"
        value-key="code"
        icon="hugeicons:global"
        class="w-full"
      >
        <template #item-leading="{ item }">
          <span :class="`fi fi-${item.code}`" />
        </template>
      </USelectMenu>
    </UFormField>

    <UFormField label="Website" name="website">
      <UInput
        v-model.trim="brand.website"
        icon="hugeicons:globe-02"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Instagram" name="instagram">
      <UInput
        v-model.trim="brand.instagram"
        icon="hugeicons:instagram"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Discord" name="discord">
      <UInput
        v-model.trim="brand.discord"
        icon="hugeicons:discord"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Bio"
      name="bio"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="brand.bio" :rows="5" class="w-full" />
    </UFormField>

    <UButton
      v-if="mode === 'standalone'"
      block
      color="primary"
      type="submit"
      loading-auto
    >
      Save
    </UButton>
  </UForm>
</template>

<script setup>
import slugify from 'slugify'
import country from 'flag-icons/country.json'
import { brandSchema } from '~/utils/schemas/keyboard'

const emit = defineEmits(['onSuccess', 'update:modelValue'])

const { metadata, modelValue, isEdit, mode } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Object,
    default: null,
  },
  isEdit: Boolean,
  mode: {
    type: String,
    default: 'standalone',
    validator: (value) => ['standalone', 'embedded'].includes(value),
  },
})

const toast = useToast()

const brand = ref({
  name: '',
  slug: '',
  country_origin: '',
  website: '',
  instagram: '',
  discord: '',
})

onBeforeMount(() => {
  Object.assign(brand.value, modelValue || metadata || {})
})

watch(
  () => modelValue,
  (value) => {
    if (value && value !== brand.value) {
      Object.assign(brand.value, value)
    }
  },
)

watch(
  brand,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

const onSubmit = async () => {
  const slug = isEdit
    ? String(metadata?.slug || brand.value.slug || '').trim()
    : String(brand.value.slug || '').trim() ||
      slugify(brand.value.name, { lower: true })

  await $fetch(`/api/keyboards/brands/${slug}`, {
    method: 'post',
    body: {
      ...brand.value,
      slug,
    },
  })
    .then((data) => {
      toast.add(
        handleSuccess(isEdit ? 'update' : 'add', brand.value.name, 'Brand'),
      )
      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
