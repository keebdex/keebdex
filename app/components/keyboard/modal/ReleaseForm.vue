<template>
  <UForm :schema="schema" :state="release" class="space-y-4" @submit="onSubmit">
    <UFormField label="Release Name" name="name" required>
      <UInput
        v-model.trim="release.name"
        icon="hugeicons:tag-01"
        placeholder="e.g. Round 1"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Order" name="order">
      <UInput
        v-model.number="release.order"
        type="number"
        icon="hugeicons:hashtag"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Release Year" name="release_year">
      <UInput
        v-model.number="release.release_year"
        type="number"
        icon="hugeicons:calendar-03"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Mount Style" name="mount_style">
      <USelect
        v-model="release.mount_style"
        :items="Constants.public.Enums.keyboard_mounting_style"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Typing Angle" name="typing_angle">
      <UInput
        v-model.number="release.typing_angle"
        type="number"
        step="0.1"
        icon="hugeicons:angle-01"
        class="w-full"
      />
    </UFormField>

    <UFormField label="MSRP" name="msrp_price">
      <UFieldGroup class="w-full">
        <USelect v-model="release.currency" :items="currencies" />
        <UInput
          v-model.number="release.msrp_price"
          type="number"
          step="0.01"
          placeholder="0.00"
          class="w-full"
        />
      </UFieldGroup>
    </UFormField>

    <UFormField label="PCB" name="pcb_types">
      <USelectMenu
        v-model="release.pcb_types"
        :items="Constants.public.Enums.keyboard_pcb_type"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Plate" name="plate_materials">
      <USelectMenu
        v-model="release.plate_materials"
        :items="Constants.public.Enums.keyboard_material"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Case" name="case_materials">
      <USelectMenu
        v-model="release.case_materials"
        :items="Constants.public.Enums.keyboard_material"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Weight" name="weight_materials">
      <USelectMenu
        v-model="release.weight_materials"
        :items="Constants.public.Enums.keyboard_material"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="release.description" :rows="5" class="w-full" />
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
const currencies = Constants.public.Enums.currency

const release = ref({
  name: '',
  description: '',
  order: null,
  release_year: null,
  mount_style: null,
  pcb_types: [],
  typing_angle: null,
  currency: 'USD',
  msrp_price: null,
  case_materials: [],
  plate_materials: [],
  weight_materials: [],
})

const schema = z.object({
  name: z
    .string()
    .min(1)
    .refine(
      (value) => {
        const normalized = value.trim().toLowerCase()

        return !(releases || []).some((release) => {
          const sameId = isEdit && metadata?.id && release.id === metadata.id
          if (sameId) return false

          return (
            String(release.name || '')
              .trim()
              .toLowerCase() === normalized
          )
        })
      },
      {
        message: 'Release name must be unique for this keyboard',
      },
    ),
  order: z.coerce.number().nullish(),
  release_year: z.coerce.number().min(1900).max(2100).nullish(),
  mount_style: z.enum(Constants.public.Enums.keyboard_mounting_style).nullish(),
  typing_angle: z.coerce.number().min(0).max(30).nullish(),
  currency: z.enum(currencies).nullish().or(z.string().min(0).max(0)),
  msrp_price: z.coerce.number().min(0).nullish(),
  pcb_types: z
    .array(z.enum(Constants.public.Enums.keyboard_pcb_type))
    .nullish(),
  plate_materials: z
    .array(z.enum(Constants.public.Enums.keyboard_material))
    .nullish(),
  case_materials: z
    .array(z.enum(Constants.public.Enums.keyboard_material))
    .nullish(),
  weight_materials: z
    .array(z.enum(Constants.public.Enums.keyboard_material))
    .nullish(),
  description: z.string().max(400).nullish().or(z.string().min(0).max(0)),
})

onBeforeMount(() => {
  Object.assign(release.value, metadata || {}, {
    brand_slug: keyboard.brand_slug,
    brand_keyboard_slug: keyboard.brand_keyboard_slug,
  })

  if (!Array.isArray(release.value.case_materials)) {
    release.value.case_materials = release.value.case_materials
      ? [release.value.case_materials]
      : []
  }

  if (!Array.isArray(release.value.plate_materials)) {
    release.value.plate_materials = release.value.plate_materials
      ? [release.value.plate_materials]
      : []
  }

  if (!Array.isArray(release.value.weight_materials)) {
    release.value.weight_materials = release.value.weight_materials
      ? [release.value.weight_materials]
      : []
  }

  if (!isEdit && release.value.typing_angle === null) {
    release.value.typing_angle = keyboard?.typing_angle ?? null
  }

  // Auto-calculate order for new releases
  if (!isEdit && release.value.order === null) {
    release.value.order = (releases?.length ?? 0) + 1
  }
})

const onSubmit = async () => {
  if (!keyboard.brand_keyboard_slug) {
    toast.add(
      handleError({
        statusMessage:
          'Please save the keyboard details before adding a release.',
      }),
    )
    return
  }

  await $fetch(`/api/keyboards/${keyboard.brand_keyboard_slug}/releases`, {
    method: 'post',
    body: release.value,
  })
    .then((data) => {
      toast.add(
        handleSuccess(isEdit ? 'update' : 'add', release.value.name, 'Release'),
      )
      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
