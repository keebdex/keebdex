<template>
  <UForm
    :schema="keysetColorLinkSchema"
    :state="color"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField name="name" required>
      <KeysetColorPicker v-model="colorIds" />
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
import { keysetColorLinkSchema } from '~/utils/schemas/keyset'

const emit = defineEmits(['onSuccess', 'update:modelValue'])

const { mode, modelValue } = defineProps({
  mode: {
    type: String,
    default: 'standalone',
    validator: (value) => ['standalone', 'embedded'].includes(value),
  },
  modelValue: {
    type: Object,
    default: null,
  },
})

const route = useRoute()
const toast = useToast()

const colorIds = ref([])

const color = computed(() => {
  return {
    profile_keyset_id: `${route.params.profile}/${route.params.keyset}`,
    color_ids:
      modelValue?.color_ids || colorIds.value,
  }
})

watch(
  color,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

const onSubmit = async () => {
  await $fetch(`/api/keysets/${color.value.profile_keyset_id}/colors`, {
    method: 'post',
    body: color.value,
  })
    .then(() => {
      toast.add(successToast('update', { entity: 'Keyset colors', plural: true }))

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
}
</script>
