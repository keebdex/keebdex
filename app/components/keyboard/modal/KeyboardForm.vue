<template>
  <component :is="formWrapper" v-bind="formWrapperProps" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="keyboard.name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField v-if="includeBrand" label="Brand" name="brand_slug" required>
      <USelectMenu
        v-model="keyboard.brand_slug"
        :items="brandOptions"
        :loading="brandsStatus === 'pending'"
        value-key="value"
        label-key="label"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="!isEdit"
      label="Slug"
      name="slug"
      help="Used in URL, e.g. my-keyboard. Leave empty to auto-generate from name."
    >
      <UInput
        v-model.trim="keyboard.slug"
        icon="hugeicons:hashtag"
        placeholder="my-keyboard"
        class="w-full"
      />
    </UFormField>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <UFormField label="Form Factor" name="form_factor" required>
        <USelect
          v-model="keyboard.form_factor"
          :items="Constants.public.Enums.keyboard_form_factor"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="requiresTopCaseStyles"
        label="Top Case Styles"
        name="top_case_styles"
        required
      >
        <USelect
          v-model="keyboard.top_case_styles"
          :items="Constants.public.Enums.keyboard_top_case_style"
          multiple
          class="w-full"
        />
      </UFormField>

      <UFormField label="Mount Styles" name="mount_styles">
        <USelectMenu
          v-model="keyboard.mount_styles"
          :items="Constants.public.Enums.keyboard_mounting_style"
          multiple
          class="w-full"
        />
      </UFormField>

      <UFormField label="Typing Angle" name="typing_angle">
        <UInput
          v-model.number="keyboard.typing_angle"
          type="number"
          step="0.1"
          icon="hugeicons:angle-01"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField
      label="Original Design"
      name="derived_from"
      help="Optional. Pick the keyboard this design is based on."
    >
      <USelectMenu
        v-model="selectedOriginalKeyboard"
        v-model:search-term="term"
        :items="originalKeyboardOptions"
        label-key="label"
        :loading="status === 'pending'"
        ignore-filter
        icon="hugeicons:keyboard"
        placeholder="Type at least 2 characters to search..."
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="keyboard.description" :rows="5" class="w-full" />
    </UFormField>

    <UButton
      v-if="isStandalone"
      block
      color="primary"
      type="submit"
      loading-auto
    >
      Save
    </UButton>
  </component>
</template>

<script setup>
import slugify from 'slugify'
import { Constants } from '~/types/database.types'
import {
  keyboardSchema,
  keyboardSubmissionSchema,
  keyboardTopCaseStylesEnabled,
} from '~/utils/schemas/keyboard'

const emit = defineEmits(['onSuccess', 'update:modelValue'])

const props = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Object,
    default: null,
  },
  isEdit: Boolean,
  includeBrand: Boolean,
  mode: {
    type: String,
    default: 'standalone',
    validator: (value) => ['standalone', 'embedded'].includes(value),
  },
})

const route = useRoute()
const toast = useToast()
const colorMode = useColorMode()

const {
  public: { imgUrl },
} = useRuntimeConfig()

const isEdit = computed(() => props.isEdit)
const includeBrand = computed(() => props.includeBrand)
const isStandalone = computed(() => props.mode === 'standalone')
const formWrapper = computed(() =>
  isStandalone.value ? resolveComponent('UForm') : 'div',
)
const schema = computed(() =>
  includeBrand.value ? keyboardSubmissionSchema : keyboardSchema,
)
const formWrapperProps = computed(() =>
  isStandalone.value
    ? { schema: schema.value, state: keyboard.value, class: 'space-y-4' }
    : { class: 'space-y-4' },
)

const { data: brands, status: brandsStatus } = await useAsyncData(
  'keyboard-form-brands',
  () => $fetch('/api/keyboards/brands'),
)

const brandOptions = computed(() =>
  (brands.value || []).map((brand) => ({
    label: brand.name,
    value: brand.slug,
  })),
)

const defaultKeyboard = () => ({
  name: '',
  slug: '',
  brand_slug: '',
  form_factor: Constants.public.Enums.keyboard_form_factor[0],
  top_case_styles: [],
  mount_styles: [],
  typing_angle: null,
  derived_from: null,
  description: '',
})

const keyboard = ref(defaultKeyboard())

const requiresTopCaseStyles = computed(() =>
  keyboardTopCaseStylesEnabled.includes(keyboard.value.form_factor),
)

const selectedOriginalKeyboard = ref(null)
const term = ref('')

const { data, status } = useGuardedSearch('/api/search', {
  key: 'keyboard-original-search',
  term,
  module: 'keyboard',
})

const originalKeyboardOptions = computed(() => {
  const groups = Array.isArray(data.value) ? data.value : []
  return groups
    .filter((group) => group.id === 'keyboard-board')
    .flatMap((group) => group.items || [])
    .map((item) => {
      const invertible = Boolean(item?.avatar?.invertible)

      return {
        value: item.to.replace('/keyboard/brand/', ''),
        label: formatKeyboardDescription([item.label, item.suffix]),
        avatar: item.avatar
          ? {
              ...item.avatar,
              ui: {
                root: 'bg-transparent rounded-none',
                image: invertible && colorMode.value === 'dark' && 'invert',
              },
            }
          : undefined,
      }
    })
})

onBeforeMount(() => {
  Object.assign(
    keyboard.value,
    defaultKeyboard(),
    props.modelValue || props.metadata || {},
  )

  if (!Array.isArray(keyboard.value.mount_styles)) {
    keyboard.value.mount_styles = keyboard.value.mount_styles
      ? [keyboard.value.mount_styles]
      : []
  }

  if (keyboard.value.derived_from) {
    selectedOriginalKeyboard.value = {
      value: props.metadata.derived_from,
      label: formatKeyboardDescription([
        props.metadata?.original?.brand?.name,
        props.metadata?.original?.name,
      ]),
      avatar: {
        src: `${imgUrl}/logo/${props.metadata?.original?.brand_slug}.png`,
        alt: props.metadata?.original?.brand?.name,
        ui: {
          root: 'bg-transparent rounded-none',
          image:
            props.metadata?.original?.brand?.invertible_logo &&
            colorMode.value === 'dark' &&
            'invert',
        },
      },
    }
  }
})

watch(selectedOriginalKeyboard, (value) => {
  keyboard.value.derived_from = value?.value || null
})

watch(
  () => keyboard.value.form_factor,
  (value) => {
    if (!keyboardTopCaseStylesEnabled.includes(value)) {
      keyboard.value.top_case_styles = []
    }
  },
)

watch(
  () => props.modelValue,
  (value) => {
    if (value && value !== keyboard.value) {
      Object.assign(keyboard.value, defaultKeyboard(), value)
    }
  },
)

watch(
  keyboard,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

const onSubmit = async () => {
  if (!isStandalone.value) return

  const slug = slugify(keyboard.value.name, { lower: true })

  const brand_slug = route.params.brand

  await $fetch(`/api/keyboards/${brand_slug}/${route.params.keyboard}`, {
    method: 'post',
    body: {
      ...keyboard.value,
      slug,
      brand_slug,
      brand_keyboard_slug: `${brand_slug}/${slug}`,
      derived_from: keyboard.value.derived_from || null,
      top_case_styles: requiresTopCaseStyles.value
        ? keyboard.value.top_case_styles
        : null,
      mount_styles:
        Array.isArray(keyboard.value.mount_styles) &&
        keyboard.value.mount_styles.length
          ? keyboard.value.mount_styles
          : null,
    },
  })
    .then((data) => {
      toast.add(
        handleSuccess(
          isEdit.value ? 'update' : 'add',
          keyboard.value.name,
          'Keyboard',
        ),
      )

      if (isEdit.value && String(route.params.keyboard || '') !== slug) {
        navigateTo(`/keyboard/brand/${brand_slug}/${slug}`)
      }

      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
