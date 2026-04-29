<template>
  <UForm :schema="schema" :state="color" class="space-y-4" @submit="onSubmit">
    <UFormField label="Matching System" name="system" required>
      <USelect v-model="color.system" :items="colorSystems" class="w-full" />
    </UFormField>

    <UFormField label="Code" name="code" required>
      <UFieldGroup class="w-full">
        <UInputMenu
          v-model.trim="color.code"
          v-model:search-term="codeTerm"
          :items="codeOptions"
          :loading="status === 'pending'"
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
            <UUser
              :name="`${item.system} ${item.code}`"
              :description="item.name"
            >
              <template #avatar>
                <UAvatar :style="{ backgroundColor: item.hex }" />
              </template>
            </UUser>
          </template>
        </UInputMenu>

        <UButton
          v-if="isSystemFetchSupported"
          icon="hugeicons:search-area"
          variant="outline"
          :loading="isFetchingFromSource"
          @click="fetchColorFromSystem"
        />
      </UFieldGroup>

      <template v-if="hasDuplicateInSystem" #error>
        This code already exists in {{ color.system }}. Saving will ignore
        duplicates.
      </template>
      <template v-else-if="isSystemFetchSupported" #help>
        Look up a code to auto-fill the hex value and name.
      </template>
    </UFormField>

    <UFormField
      label="Name"
      name="name"
      placeholder="e.g. Leather Red"
      help="Use the color name, not the matching code."
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
const isFetchingFromSource = ref(false)
let autoFetchTimer = null
const lastAutoFetchedRalCode = ref('')

const codeTerm = ref('')
const term = computed(() => (isEdit ? '' : codeTerm.value))

const { data, status } = useAdvancedSearch('/api/colors', {
  key: 'keyset-color-code-search',
  term,
  minLength: 2,
  filters: {
    system: computed(() => color.value.system || undefined),
  },
})

const codeOptions = computed(() => {
  return (data.value?.data || []).map((item) => ({
    ...item,
    label: `${item.system} ${item.code}`,
  }))
})

onBeforeMount(() => {
  Object.assign(color.value, metadata)
})

const colorSystems = Constants.public.Enums.keyset_color_matching_system
const isSystemFetchSupported = computed(
  () => color.value.system?.toUpperCase() === 'RAL',
)

const normalizeRalCode = (value) => {
  const parts = value
    .replace(/^ral\s*/i, '')
    .replace(/[^0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length !== 3) return null

  const a = parts[0]
  const b = parts[1]
  const c = parts[2]

  if (!a || !b || !c) return null
  if (a.length !== 3 || b.length !== 2 || c.length !== 2) return null

  return `${a} ${b} ${c}`
}

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

const fetchColorFromSystem = async ({ silent = false } = {}) => {
  if (!isSystemFetchSupported.value) {
    return
  }

  const normalizedRalCode = normalizeRalCode(color.value.code?.trim() || '')

  if (!color.value.system || !normalizedRalCode) {
    if (silent) return

    toast.add(
      handleError({
        statusCode: 400,
        statusMessage: 'Please enter a valid RAL code (000 00 00).',
      }),
    )
    return
  }

  isFetchingFromSource.value = true

  await $fetch('/api/colors/fetch', {
    method: 'post',
    body: {
      system: color.value.system,
      code: normalizedRalCode,
    },
  })
    .then((result) => {
      color.value.system = result.system
      color.value.code = result.code
      color.value.hex = result.hex
      if (result.name) color.value.name = result.name

      lastAutoFetchedRalCode.value = result.code

      if (!silent) {
        toast.add(
          handleSuccess(
            'update',
            `${result.system} ${result.code}`,
            'Color Data',
          ),
        )
      }
    })
    .catch((error) => {
      if (!silent) {
        toast.add(handleError(error, { showOriginalMessage: true }))
      }
    })
    .finally(() => {
      isFetchingFromSource.value = false
    })
}

watch([() => color.value.system, () => color.value.code], ([system, code]) => {
  if (autoFetchTimer) {
    clearTimeout(autoFetchTimer)
    autoFetchTimer = null
  }

  if (!system || system.toUpperCase() !== 'RAL' || !code || isEdit) {
    return
  }

  const normalizedRalCode = normalizeRalCode(code)

  if (
    !normalizedRalCode ||
    normalizedRalCode === lastAutoFetchedRalCode.value
  ) {
    return
  }

  autoFetchTimer = setTimeout(() => {
    fetchColorFromSystem({ silent: true })
  }, 500)
})

onBeforeUnmount(() => {
  if (autoFetchTimer) {
    clearTimeout(autoFetchTimer)
    autoFetchTimer = null
  }
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
