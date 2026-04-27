<template>
  <UForm :schema="schema" :state="color" class="space-y-4" @submit="onSubmit">
    <UFormField label="Matching System" name="system" required>
      <USelect v-model="color.system" :items="colorSystems" class="w-full" />
    </UFormField>

    <UFormField label="Code" name="code" required>
      <UInputMenu
        v-model.trim="color.code"
        v-model:search-term="codeTerm"
        :items="codeOptions"
        :loading="codeOptionsStatus === 'pending'"
        :content="{ hideWhenEmpty: true }"
        autocomplete
        ignore-filter
        label-key="label"
        value-key="code"
        icon="hugeicons:tag-01"
        placeholder="Type a code to search existing colors..."
        class="w-full"
      >
        <template #item="{ item }">
          <UUser :name="`${item.system} ${item.code}`" :description="item.name">
            <template #avatar>
              <UAvatar :style="{ backgroundColor: item.hex }" />
            </template>
          </UUser>
        </template>
      </UInputMenu>

      <p v-if="hasDuplicateInSystem" class="mt-2 text-xs text-warning">
        This code already exists in {{ color.system }}. Saving will ignore
        duplicates.
      </p>
    </UFormField>

    <UFormField
      label="Name"
      name="name"
      help="Use the color name (for example: Leather Red), not the matching code."
    >
      <UInput
        v-model.trim="color.name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Hex"
      name="hex"
      required
      help="Enter a valid hex color starting with # — use 3 or 6 hex digits (0-9, A-F)"
    >
      <UInput
        v-model.trim="color.hex"
        icon="hugeicons:paint-board"
        class="w-full"
      />
    </UFormField>

    <UCard
      v-if="color.hex"
      class="h-32"
      :style="{ backgroundColor: color.hex }"
    />

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'
import { Constants } from '~/types/database.types'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
})

const toast = useToast()

const color = ref({
  name: '',
})

const codeTerm = ref('')
const codeOptionsStatus = ref('idle')
const codeOptions = ref([])

const fetchCodeOptions = async () => {
  const term = codeTerm.value.trim()

  if (isEdit || term.length < 2) {
    codeOptions.value = []
    codeOptionsStatus.value = 'idle'
    return
  }

  codeOptionsStatus.value = 'pending'

  await $fetch('/api/colors', {
    query: {
      term,
      system: color.value.system,
      page: 1,
      size: 10,
    },
  })
    .then((data) => {
      codeOptions.value = (data.colors || []).map((item) => ({
        ...item,
        label: `${item.system} ${item.code}`,
      }))
      codeOptionsStatus.value = 'success'
    })
    .catch((error) => {
      codeOptions.value = []
      codeOptionsStatus.value = 'error'
      toast.add(handleError(error))
    })
}

onBeforeMount(() => {
  Object.assign(color.value, metadata)
})

watch([codeTerm, () => color.value.system], fetchCodeOptions)

const colorSystems = Constants.public.Enums.keyset_color_matching_system

const hasDuplicateInSystem = computed(() => {
  const code = color.value.code?.toString().trim().toLowerCase()

  if (!code || !color.value.system) {
    return false
  }

  return codeOptions.value.some((item) => {
    const sameSystem = item.system === color.value.system
    const sameCode = item.code?.toString().trim().toLowerCase() === code
    const notCurrentRecord = !isEdit || item.id !== metadata?.id

    return sameSystem && sameCode && notCurrentRecord
  })
})

const schema = z.object({
  system: z.enum(colorSystems),
  code: z.string().min(1),
  name: z.string().nullish(),
  hex: z
    .string()
    .lowercase()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/),
})

const onSubmit = async () => {
  color.value.hex = color.value.hex.toLowerCase()

  await $fetch(`/api/colors`, {
    method: 'post',
    body: color.value,
  })
    .then(() => {
      toast.add(
        handleSuccess(isEdit ? 'update' : 'add', color.value.name, 'Color'),
      )

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
