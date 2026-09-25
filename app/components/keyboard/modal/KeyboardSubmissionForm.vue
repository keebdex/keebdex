<template>
  <UForm
    :schema="keyboardSubmissionSchema"
    :state="keyboard"
    class="space-y-6"
    @submit="onSave"
  >
    <div class="space-y-4">
      <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
        Keyboard Info
      </p>

      <KeyboardModalKeyboardForm
        v-model="keyboard"
        mode="embedded"
        include-brand
      />
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
          Releases
        </p>
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

          <UButton
            label="Add Variant"
            size="xs"
            variant="soft"
            icon="hugeicons:plus-sign"
            block
            @click="addVariant(release)"
          />
        </div>
      </div>

      <p v-if="!releases.length" class="text-sm text-dimmed">
        No releases added yet. Click "Add Release" to attach the releases
        included in this keyboard.
      </p>

      <UButton
        label="Add Release"
        size="xs"
        variant="soft"
        icon="hugeicons:plus-sign"
        block
        @click="addRelease"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        :label="isEdit ? 'Save Changes' : 'Submit Keyboard'"
        type="submit"
        color="primary"
        loading-auto
      />

      <template v-if="userStore.isModerator && isEdit">
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
import { keyboardSubmissionSchema } from '~/utils/schemas/keyboard'

const emit = defineEmits(['onSuccess', 'onDelete'])

const { metadata } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
})

const toast = useToast()
const userStore = useUserStore()
const currencies = Constants.public.Enums.currency

const isEdit = computed(() => !!metadata.id)
const canDelete = computed(
  () =>
    isEdit.value &&
    (userStore.isModerator || metadata.review_status !== 'Approved'),
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

const processingAction = ref(null)
const { save, remove } = useKeyboardSubmission({ keyboard, releases, isEdit })

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
    await remove()

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
