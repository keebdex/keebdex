<template>
  <UForm
    :schema="keysetColorSchema"
    :state="color"
    class="space-y-4"
    @submit="onSubmit"
  >
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
          mode="autocomplete"
          ignore-filter
          label-key="label"
          value-key="code"
          icon="solar:tag-line-duotone"
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
          icon="solar:magnifer-zoom-in-line-duotone"
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
        icon="solar:text-format-line-duotone"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Hex"
      name="hex"
      required
      :help="
        isPantone
          ? 'Pantone does not publish its hex values, so this one is read from its swatch image and is for reference only.'
          : 'Enter a valid hex color starting with # — use 3 or 6 hex digits (0-9, A-F)'
      "
    >
      <UInput
        v-model.trim="color.hex"
        icon="solar:palette-line-duotone"
        class="w-full"
      />
    </UFormField>

    <UCard
      v-if="color.hex"
      class="h-32"
      :style="{ backgroundColor: color.hex }"
    />

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
import { normalizeRalCode, parsePantoneCode } from '~/utils/color'
import { keysetColorSchema } from '~/utils/schemas/keyset'

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

const color = ref({
  name: '',
})
const isFetchingFromSource = ref(false)
let autoFetchTimer = null
const lastAutoFetchedCode = ref('')

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
  Object.assign(color.value, modelValue || metadata)
})

watch(
  () => modelValue,
  (value) => {
    if (value && value !== color.value) {
      Object.assign(color.value, value)
    }
  },
)

watch(
  color,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

const colorSystems = Constants.public.Enums.keyset_color_matching_system
// Systems whose codes can be looked up at the source, with how a code is
// written and the hint shown when it is not.
const LOOKUPS = {
  RAL: {
    normalize: normalizeRalCode,
    invalid: 'Please enter a valid RAL code (000 00 00).',
    title: 'Invalid RAL Code',
  },
  PANTONE: {
    normalize: (value) => parsePantoneCode(value)?.code || null,
    invalid:
      'Please enter a Pantone code with its library suffix, e.g. 185 C or 19-4052 TCX.',
    title: 'Invalid Pantone Code',
  },
}

const lookup = computed(() => LOOKUPS[color.value.system?.toUpperCase()])
const isSystemFetchSupported = computed(() => !!lookup.value)
const isPantone = computed(
  () => color.value.system?.toUpperCase() === 'PANTONE',
)

/**
 * The hex of a flat swatch image: its most common pixel, so a lossy edge or
 * a stray block does not shift it.
 */
const readSwatchHex = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      const context = canvas.getContext('2d', { willReadFrequently: true })
      context.drawImage(image, 0, 0)

      const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
      const counts = new Map()
      let best = null

      for (let index = 0; index < data.length; index += 4) {
        const hex = `#${[data[index], data[index + 1], data[index + 2]]
          .map((channel) => channel.toString(16).padStart(2, '0'))
          .join('')}`
        const count = (counts.get(hex) || 0) + 1
        counts.set(hex, count)
        if (!best || count > counts.get(best)) best = hex
      }

      if (best) resolve(best)
      else reject(new Error('Empty swatch image'))
    }
    image.onerror = () => reject(new Error('Unable to read the swatch image'))
    image.src = src
  })

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

const fetchColorFromSystem = async ({ silent = false } = {}) => {
  if (!isSystemFetchSupported.value) {
    return
  }

  const { normalize, invalid, title } = lookup.value
  const normalizedCode = normalize(color.value.code?.trim() || '')

  if (!normalizedCode) {
    if (silent) return

    toast.add(validationToast(invalid, title))
    return
  }

  isFetchingFromSource.value = true

  await $fetch('/api/colors/fetch', {
    method: 'post',
    body: {
      system: color.value.system,
      code: normalizedCode,
    },
  })
    .then(async (result) => {
      const hex = result.hex || (await readSwatchHex(result.swatch))

      color.value.system = result.system
      color.value.code = result.code
      color.value.hex = hex
      if (result.name) color.value.name = result.name

      lastAutoFetchedCode.value = result.code

      if (!silent) {
        toast.add(
          noticeToast('color_fetched', `${result.system} ${result.code}`),
        )
      }
    })
    .catch((error) => {
      if (!silent) {
        toast.add(errorToast(error, { showOriginalMessage: true }))
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

  const normalize = LOOKUPS[system?.toUpperCase()]?.normalize

  if (!normalize || !code || isEdit) {
    return
  }

  const normalizedCode = normalize(code)

  if (!normalizedCode || normalizedCode === lastAutoFetchedCode.value) {
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
        successToast(isEdit ? 'update' : 'add', {
          entity: 'Color',
          name: color.value.name,
        }),
      )

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
}
</script>
