<template>
  <UForm
    :schema="keysetProfileSchema"
    :state="profile"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="profile.name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="!isEdit"
      label="Slug"
      name="profile_id"
      help="Used in URL, e.g. gmk-cyl. Leave empty to auto-generate from name. It can't be changed once the profile is published."
      :ui="{ help: 'text-warning' }"
    >
      <UInput
        v-model.trim="profile.profile_id"
        icon="hugeicons:text-font"
        class="w-full"
        placeholder="gmk-cyl"
      />
    </UFormField>

    <UFormField label="Profile" name="profile">
      <USelect
        v-model="profile.profile"
        :items="profileOptions"
        placeholder="Keycap profile"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Manufacturer" name="manufacturer">
      <UInput
        v-model.trim="profile.manufacturer"
        icon="hugeicons:factory"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Manufacturer Logo"
      name="manufacturer_id"
      help="The logo file the profile page shows, e.g. gmk."
    >
      <UInput
        v-model.trim="profile.manufacturer_id"
        icon="hugeicons:hashtag"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Description" name="description">
      <UTextarea
        v-model.trim="profile.description"
        :rows="5"
        class="w-full"
      />
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
import { Constants } from '~/types/database.types'
import { keysetProfileSchema } from '~/utils/schemas/keyset'

// A keyset profile (GMK, SA, ...): added on the profile list, edited on the
// profile page, and embedded in edit suggestions and the keyset submission
// wizard (`mode="embedded"`). The slug is set only when it is added.
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

const profileOptions = Constants.public.Enums.keyset_profile

const profile = ref({
  profile_id: '',
  name: '',
  profile: null,
  manufacturer: '',
  manufacturer_id: '',
  description: '',
})

onBeforeMount(() => {
  Object.assign(profile.value, modelValue || metadata || {})
})

watch(
  () => modelValue,
  (value) => {
    if (value && value !== profile.value) {
      Object.assign(profile.value, value)
    }
  },
)

watch(
  profile,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

const onSubmit = async () => {
  if (mode !== 'standalone') return

  // The server keys the profile by the route, never by the body.
  const profileId = isEdit
    ? metadata.profile_id
    : profile.value.profile_id || urlSlugify(profile.value.name)

  await $fetch(`/api/profiles/${profileId}`, {
    method: 'post',
    body: profile.value,
  })
    .then((data) => {
      toast.add(
        successToast(isEdit ? 'update' : 'add', {
          entity: 'Profile',
          name: profile.value.name,
        }),
      )
      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
}
</script>
