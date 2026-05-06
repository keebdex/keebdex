<template>
  <UForm
    :schema="schema"
    :state="keyboard"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="keyboard.name"
        icon="hugeicons:text-font"
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

    <UButton block color="primary" type="submit" loading-auto>Save</UButton>
  </UForm>
</template>

<script setup>
import slugify from 'slugify'
import { Constants } from '~/types/database.types'
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
})

const route = useRoute()
const toast = useToast()
const colorMode = useColorMode()

const keyboard = ref({
  name: '',
  slug: '',
  form_factor: Constants.public.Enums.keyboard_form_factor[0],
  top_case_styles: [],
  typing_angle: null,
  derived_from: null,
})

const topCaseStylesEnabled = ['60%', 'TKL']

const requiresTopCaseStyles = computed(() =>
  topCaseStylesEnabled.includes(keyboard.value.form_factor),
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

const schema = z
  .object({
    name: z.string().min(1),
    slug: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Use lowercase letters, numbers, and hyphens only',
      )
      .nullish()
      .or(z.string().min(0).max(0)),
    form_factor: z.enum(Constants.public.Enums.keyboard_form_factor),
    top_case_styles: z.array(
      z.enum(Constants.public.Enums.keyboard_top_case_style),
    ),
    typing_angle: z.coerce.number().min(0).max(30).nullish(),
    derived_from: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Expected format: brand-slug/keyboard-slug',
      )
      .nullish()
      .or(z.string().min(0).max(0)),
  })
  .superRefine((value, context) => {
    if (
      topCaseStylesEnabled.includes(value.form_factor) &&
      value.top_case_styles.length === 0
    ) {
      context.addIssue({
        code: 'custom',
        path: ['top_case_styles'],
        message: 'Top case styles are required for this form factor',
      })
    }
  })

onBeforeMount(() => {
  Object.assign(keyboard.value, metadata || {})

  if (keyboard.value.derived_from) {
    selectedOriginalKeyboard.value = {
      value: metadata.derived_from,
      label: formatKeyboardDescription([
        metadata?.original?.brand?.name,
        metadata?.original?.name,
      ]),
      avatar: {
        src: `/logo/${metadata?.original?.brand_slug}.png`,
        alt: metadata?.original?.brand?.name,
        ui: {
          root: 'bg-transparent rounded-none',
          image:
            metadata?.original?.brand?.invertible_logo &&
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
    if (!topCaseStylesEnabled.includes(value)) {
      keyboard.value.top_case_styles = []
    }
  },
)

const onSubmit = async () => {
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
    },
  })
    .then((data) => {
      toast.add(
        handleSuccess(
          isEdit ? 'update' : 'add',
          keyboard.value.name,
          'Keyboard',
        ),
      )

      if (isEdit && String(route.params.keyboard || '') !== slug) {
        navigateTo(`/keyboard/brand/${brand_slug}/${slug}`)
      }

      emit('onSuccess', data)
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
