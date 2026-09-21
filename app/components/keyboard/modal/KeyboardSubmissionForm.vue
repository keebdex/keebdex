<template>
  <UForm :schema="schema" :state="keyboard" class="space-y-6" @submit="onSave">
    <div class="space-y-4">
      <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
        Keyboard Info
      </p>

      <UFormField label="Name" name="name" required>
        <UInput
          v-model.trim="keyboard.name"
          icon="hugeicons:text-font"
          class="w-full"
        />
      </UFormField>

      <div class="grid grid-cols-2 gap-2">
        <UFormField label="Brand" name="brand_slug" required>
          <USelectMenu
            v-model="keyboard.brand_slug"
            :items="brandOptions"
            :loading="brandsStatus === 'pending'"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Form Factor" name="form_factor" required>
          <USelect
            v-model="keyboard.form_factor"
            :items="Constants.public.Enums.keyboard_form_factor"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField
        v-if="requiresTopCaseStyles"
        label="Top Case Styles"
        name="top_case_styles"
        required
      >
        <USelectMenu
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

      <UFormField label="Description" name="description">
        <UTextarea
          v-model.trim="keyboard.description"
          :rows="4"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
          Releases
        </p>

        <UButton
          label="Add Release"
          size="xs"
          variant="soft"
          icon="hugeicons:plus-sign"
          @click="addRelease"
        />
      </div>

      <div
        v-for="(release, releaseIndex) in releases"
        :key="release._key"
        class="space-y-3 rounded-lg border border-default p-4"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium text-dimmed">
            Release #{{ releaseIndex + 1 }}
          </p>

          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="hugeicons:delete-02"
            @click="removeRelease(releaseIndex)"
          />
        </div>

        <UFormField
          label="Release Name"
          :name="`releases.${releaseIndex}.name`"
        >
          <UInput v-model.trim="release.name" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-2">
          <UFormField
            label="Release Year"
            :name="`releases.${releaseIndex}.release_year`"
          >
            <UInput
              v-model.number="release.release_year"
              type="number"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="MSRP"
            :name="`releases.${releaseIndex}.msrp_price`"
          >
            <UFieldGroup class="w-full">
              <USelect v-model="release.currency" :items="currencies" />
              <UInput
                v-model.number="release.msrp_price"
                type="number"
                step="0.01"
                class="w-full"
              />
            </UFieldGroup>
          </UFormField>
        </div>

        <UFormField
          label="Description"
          :name="`releases.${releaseIndex}.description`"
        >
          <UTextarea
            v-model.trim="release.description"
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium text-dimmed">Variants</p>

            <UButton
              label="Add Variant"
              size="xs"
              variant="soft"
              icon="hugeicons:plus-sign"
              @click="addVariant(release)"
            />
          </div>

          <div
            v-for="(variant, variantIndex) in release.variants"
            :key="variant._key"
            class="space-y-2 rounded-lg border border-dashed border-default p-3"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs text-dimmed">Variant #{{ variantIndex + 1 }}</p>

              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="hugeicons:delete-02"
                @click="removeVariant(release, variantIndex)"
              />
            </div>

            <UFormField
              label="Variant Name"
              :name="`releases.${releaseIndex}.variants.${variantIndex}.variant_name`"
            >
              <UInput v-model.trim="variant.variant_name" class="w-full" />
            </UFormField>

            <UFormField
              label="Finish Type"
              :name="`releases.${releaseIndex}.variants.${variantIndex}.finish_type`"
            >
              <USelect
                v-model="variant.finish_type"
                :items="Constants.public.Enums.keyboard_finish_type"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Front Image"
              :name="`releases.${releaseIndex}.variants.${variantIndex}.img_front`"
            >
              <UInput v-model.trim="variant.img_front" class="w-full" />
            </UFormField>

            <UFormField
              label="Back Image"
              :name="`releases.${releaseIndex}.variants.${variantIndex}.img_back`"
            >
              <UInput v-model.trim="variant.img_back" class="w-full" />
            </UFormField>
          </div>

          <p v-if="!release.variants.length" class="text-xs text-dimmed">
            No variants added yet.
          </p>
        </div>
      </div>

      <p v-if="!releases.length" class="text-sm text-dimmed">
        No releases added yet. Click "Add Release" to attach the releases
        included in this keyboard.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        :label="isEdit ? 'Save Changes' : 'Submit Keyboard'"
        type="submit"
        color="primary"
        loading-auto
      />

      <template v-if="moderator && isEdit">
        <UButton
          label="Approve"
          color="success"
          icon="hugeicons:checkmark-circle-02"
          :loading="processingAction === 'approve'"
          @click="() => onModerate('approve')"
        />

        <UButton
          label="Reject"
          color="error"
          icon="hugeicons:cancel-circle"
          :loading="processingAction === 'reject'"
          @click="() => onModerate('reject')"
        />
      </template>

      <UButton
        v-if="canDelete"
        label="Delete"
        color="error"
        variant="soft"
        icon="hugeicons:delete-02"
        @click="deleteVisible = true"
      />
    </div>
  </UForm>

  <UModal
    v-model:open="deleteVisible"
    title="Delete Submission"
    :description="`Are you sure you want to delete ${keyboard.name}? This action cannot be undone.`"
  >
    <template #footer="{ close }">
      <UButton label="Cancel" @click="close" />
      <UButton
        label="Delete"
        color="error"
        :loading="processingDelete"
        @click="onDelete(close)"
      />
    </template>
  </UModal>
</template>

<script setup>
import { Constants } from '~/types/database.types'
import { z } from 'zod'

const emit = defineEmits(['onSuccess', 'onDelete'])

const { metadata, moderator } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  moderator: Boolean,
})

const toast = useToast()
const currencies = Constants.public.Enums.currency

const { data: brands, status: brandsStatus } = await useAsyncData(
  'keyboard-submission-brands',
  () => $fetch('/api/keyboards/brands'),
)

const brandOptions = computed(() =>
  (brands.value || []).map((brand) => ({
    label: brand.name,
    value: brand.slug,
  })),
)

const isEdit = computed(() => !!metadata.id)
const canDelete = computed(
  () => isEdit.value && (moderator || metadata.review_status !== 'Approved'),
)

const topCaseStylesEnabled = ['60%', 'TKL']
const requiresTopCaseStyles = computed(() =>
  topCaseStylesEnabled.includes(keyboard.value.form_factor),
)

const keyboard = ref({
  id: undefined,
  name: '',
  brand_slug: '',
  form_factor: Constants.public.Enums.keyboard_form_factor[0],
  top_case_styles: [],
  mount_styles: [],
  typing_angle: null,
  description: '',
})

let releaseKeySeed = 0
let variantKeySeed = 0

const newVariant = () => ({
  _key: variantKeySeed++,
  variant_name: '',
  finish_type: Constants.public.Enums.keyboard_finish_type[0],
  img_front: '',
  img_back: '',
})

const newRelease = () => ({
  _key: releaseKeySeed++,
  name: '',
  release_year: null,
  currency: 'USD',
  msrp_price: null,
  description: '',
  variants: [],
})

const releases = ref([])

onBeforeMount(() => {
  const { releases: metadataReleases, ...rest } = metadata
  Object.assign(keyboard.value, rest)

  if (!Array.isArray(keyboard.value.mount_styles)) {
    keyboard.value.mount_styles = keyboard.value.mount_styles
      ? [keyboard.value.mount_styles]
      : []
  }

  if (!Array.isArray(keyboard.value.top_case_styles)) {
    keyboard.value.top_case_styles = keyboard.value.top_case_styles
      ? [keyboard.value.top_case_styles]
      : []
  }

  releases.value = (metadataReleases || []).map((release) => ({
    ...newRelease(),
    ...release,
    variants: (release.variants || []).map((variant) => ({
      ...newVariant(),
      ...variant,
    })),
  }))

  if (!releases.value.length) {
    releases.value.push(newRelease())
  }
})

const addRelease = () => {
  releases.value.push(newRelease())
}

const removeRelease = (index) => {
  releases.value.splice(index, 1)
}

const addVariant = (release) => {
  release.variants.push(newVariant())
}

const removeVariant = (release, index) => {
  release.variants.splice(index, 1)
}

const schema = z.object({
  name: z.string().min(1),
  brand_slug: z.string().min(1, 'Please choose a brand'),
  form_factor: z.enum(Constants.public.Enums.keyboard_form_factor),
  top_case_styles: z.array(
    z.enum(Constants.public.Enums.keyboard_top_case_style),
  ),
  mount_styles: z
    .array(z.enum(Constants.public.Enums.keyboard_mounting_style))
    .nullish(),
  typing_angle: z.coerce.number().min(0).max(30).nullish(),
  description: z.string().nullish(),
})

const buildReleasesPayload = () =>
  releases.value
    .filter((release) => release.name)
    .map(({ _key, variants, ...release }) => ({
      ...release,
      variants: variants
        .filter((variant) => variant.variant_name)
        .map(({ _key: variantKey, ...variant }) => variant),
    }))

const processingAction = ref(null)

const save = async (action = 'update') => {
  const releasesPayload = buildReleasesPayload()

  if (isEdit.value) {
    return $fetch(`/api/submissions/keyboard/${keyboard.value.id}`, {
      method: 'post',
      body: { action, keyboard: keyboard.value, releases: releasesPayload },
    })
  }

  return $fetch('/api/submissions/keyboard', {
    method: 'post',
    body: { keyboard: keyboard.value, releases: releasesPayload },
  })
}

const onSave = async () => {
  try {
    await save('update')
    toast.add(
      handleSuccess(
        isEdit.value ? 'update' : 'add',
        keyboard.value.name,
        'Keyboard',
      ),
    )
    emit('onSuccess')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  }
}

const onModerate = async (action) => {
  processingAction.value = action

  try {
    await save(action)
    toast.add(handleSuccess('save', keyboard.value.name, 'Keyboard'))
    emit('onSuccess')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    processingAction.value = null
  }
}

const deleteVisible = ref(false)
const processingDelete = ref(false)

const onDelete = async (close) => {
  processingDelete.value = true

  try {
    await $fetch(`/api/submissions/keyboard/${keyboard.value.id}`, {
      method: 'delete',
    })

    toast.add(handleSuccess('delete', keyboard.value.name))
    deleteVisible.value = false
    close()
    emit('onDelete')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    processingDelete.value = false
  }
}
</script>
