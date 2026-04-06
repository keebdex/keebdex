<template>
  <UForm :schema="schema" :state="variant" class="space-y-4" @submit="onSubmit">
    <UFormField label="Release" name="release_id" required>
      <USelect
        v-model="variant.release_id"
        :items="releaseOptions"
        value-key="value"
        label-key="label"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Variant Name" name="variant_name" required>
      <UInput
        v-model.trim="variant.variant_name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Finish Type" name="finish_type" required>
      <USelect
        v-model="variant.finish_type"
        :items="Constants.public.Enums.keyboard_finish_type"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Units Produced" name="units_produced">
      <UInput
        v-model.number="variant.units_produced"
        type="number"
        icon="hugeicons:package"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Image URL" name="image_url">
      <UInput
        v-model.trim="variant.image_url"
        icon="hugeicons:image-02"
        class="w-full"
      />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto>Save</UButton>
  </UForm>
</template>

<script setup>
import { Constants } from '~/types/database.types'
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit, keyboard, releases } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
  keyboard: {
    type: Object,
    default: () => ({}),
  },
  releases: {
    type: Array,
    default: () => [],
  },
})

const toast = useToast()

const variant = ref({
  release_id: null,
  variant_name: '',
  finish_type: Constants.public.Enums.keyboard_finish_type[0],
  units_produced: null,
  image_url: '',
})

const schema = z.object({
  release_id: z.coerce.number().min(1),
  variant_name: z.string().min(1),
  finish_type: z.enum(Constants.public.Enums.keyboard_finish_type),
  units_produced: z.coerce.number().min(0).nullish(),
  image_url: z.url().nullish().or(z.string().min(0).max(0)),
})

onBeforeMount(() => {
  Object.assign(variant.value, metadata || {}, {
    brand_slug: keyboard.brand_slug,
  })
})

const releaseOptions = computed(() => {
  return releases.map((release) => ({
    label: release.name,
    value: release.id,
  }))
})

const onSubmit = async () => {
  if (!keyboard.brand_keyboard_slug) {
    toast.add(
      handleError({
        statusMessage:
          'Please save the keyboard details before adding a variant.',
      }),
    )
    return
  }

  await $fetch(`/api/keyboards/${keyboard.brand_keyboard_slug}/variants`, {
    method: 'post',
    body: variant.value,
  })
    .then((data) => {
      toast.add(
        handleSuccess(
          isEdit ? 'update' : 'add',
          variant.value.variant_name,
          'Variant',
        ),
      )
      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
