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

    <UFormField label="MSRP" name="msrp_price">
      <UFieldGroup class="w-full">
        <USelect v-model="variant.currency" :items="currencies" />
        <UInput
          v-model.number="variant.msrp_price"
          type="number"
          step="0.01"
          placeholder="0.00"
          class="w-full"
        />
      </UFieldGroup>
    </UFormField>

    <UFormField label="Weight Material" name="default_weight_material">
      <USelect
        v-model="variant.default_weight_material"
        :items="Constants.public.Enums.keyboard_material"
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

    <UFormField label="Weight Finish" name="weight_finish">
      <UInput
        v-model.trim="variant.weight_finish"
        icon="hugeicons:paint-board"
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
const currencies = ['USD', 'EUR', 'CAD', 'SGD', 'MYR', 'CNY', 'VND']

const variant = ref({
  release_id: null,
  variant_name: '',
  finish_type: Constants.public.Enums.keyboard_finish_type[0],
  currency: 'USD',
  msrp_price: null,
  default_weight_material: null,
  units_produced: null,
  image_url: '',
  weight_finish: '',
})

const schema = z.object({
  release_id: z.coerce.number().min(1),
  variant_name: z.string().min(1),
  finish_type: z.enum(Constants.public.Enums.keyboard_finish_type),
  currency: z.enum(currencies).nullish().or(z.string().min(0).max(0)),
  msrp_price: z.coerce.number().min(0).nullish(),
  default_weight_material: z
    .enum(Constants.public.Enums.keyboard_material)
    .nullish(),
  units_produced: z.coerce.number().min(0).nullish(),
  image_url: z.url().nullish().or(z.string().min(0).max(0)),
  weight_finish: z.string().nullish().or(z.string().min(0).max(0)),
})

onBeforeMount(() => {
  Object.assign(variant.value, metadata || {})
})

const releaseOptions = computed(() => {
  return releases.map((release) => ({
    label: release.label || `Release #${release.id}`,
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
