<template>
  <div class="space-y-6">
    <UStepper
      ref="stepper"
      v-model="active"
      :items="items"
      disabled
      class="w-full"
    >
      <template #brand>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Pick the brand this keyboard belongs to.
          </p>

          <USelectMenu
            v-model="brand.id"
            :items="brandOptions"
            :loading="brandsStatus === 'pending'"
            :disabled="mode === 'review'"
            value-key="value"
            label-key="label"
            placeholder="Select a brand"
            class="w-full"
          />

          <p v-if="selectedBrandLabel" class="text-xs text-dimmed">
            Selected: <strong>{{ selectedBrandLabel }}</strong>
          </p>
        </div>
      </template>

      <template #keyboard>
        <div class="space-y-4">
          <UTabs
            v-if="mode === 'create' && keyboardOptions.length"
            v-model="keyboardMode"
            :items="keyboardModeTabs"
            size="sm"
          />

          <USelectMenu
            v-if="mode === 'create' && keyboardMode === 'existing'"
            v-model="existingKeyboard.id"
            :items="keyboardOptions"
            :loading="keyboardsStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a keyboard"
            class="w-full"
          />

          <p
            v-if="
              mode === 'create' &&
              keyboardMode === 'existing' &&
              selectedKeyboardLabel
            "
            class="text-xs text-dimmed"
          >
            Selected: <strong>{{ selectedKeyboardLabel }}</strong>
          </p>

          <KeyboardModalKeyboardForm
            v-if="mode === 'review' || keyboardMode === 'new'"
            v-model="keyboard"
            mode="embedded"
          />
        </div>
      </template>

      <template #release>
        <div class="space-y-4">
          <UTabs
            v-if="keyboardMode === 'existing' && releaseOptions.length"
            v-model="releaseMode"
            :items="releaseModeTabs"
            size="sm"
          />

          <USelectMenu
            v-if="releaseMode === 'existing'"
            v-model="existingRelease.id"
            :items="releaseOptions"
            :loading="releasesStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a release"
            class="w-full"
          />

          <p
            v-if="releaseMode === 'existing' && selectedReleaseLabel"
            class="text-xs text-dimmed"
          >
            Selected: <strong>{{ selectedReleaseLabel }}</strong>
          </p>

          <KeyboardModalReleaseForm
            v-else
            v-model="release"
            :keyboard="{ releases: [] }"
            mode="embedded"
          />
        </div>
      </template>

      <template #variant>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Add one or more variants for this release.
          </p>

          <div
            v-for="(variant, index) in variants"
            :key="variant._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-dimmed">
                Variant #{{ index + 1 }}
              </p>

              <UButton
                aria-label="Remove variant"
                size="xs"
                color="error"
                variant="ghost"
                icon="hugeicons:delete-02"
                :disabled="variants.length === 1"
                @click="removeVariant(index)"
              />
            </div>

            <KeyboardModalVariantForm
              v-model="variants[index]"
              :keyboard="keyboardForVariantForm"
              mode="embedded"
            />
          </div>

          <UButton
            label="Add Variant"
            size="xs"
            variant="soft"
            icon="hugeicons:plus-sign"
            block
            @click="addVariant"
          />
        </div>
      </template>

      <template #releases>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Review and edit the releases and variants included in this
            submission.
          </p>

          <div
            v-for="(releaseEntry, index) in releases"
            :key="releaseEntry._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-dimmed">
                Release #{{ index + 1 }}
              </p>

              <UButton
                aria-label="Remove release"
                size="xs"
                color="error"
                variant="ghost"
                icon="hugeicons:delete-02"
                :disabled="releases.length === 1"
                @click="removeRelease(index)"
              />
            </div>

            <KeyboardModalReleaseForm
              v-model="releases[index]"
              :keyboard="{ releases: [] }"
              mode="embedded"
            />

            <div class="space-y-3 border-t border-dashed border-default pt-3">
              <p class="text-xs font-medium text-dimmed">Variants</p>

              <div
                v-for="(variant, variantIndex) in releaseEntry.variants"
                :key="variant._key"
                class="space-y-2 rounded-lg border border-dashed border-default p-3"
              >
                <div class="flex items-center justify-between">
                  <p class="text-xs text-dimmed">
                    Variant #{{ variantIndex + 1 }}
                  </p>

                  <UButton
                    aria-label="Remove variant"
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="hugeicons:delete-02"
                    :disabled="releaseEntry.variants.length === 1"
                    @click="removeReleaseVariant(releaseEntry, variantIndex)"
                  />
                </div>

                <KeyboardModalVariantForm
                  v-model="releaseEntry.variants[variantIndex]"
                  :keyboard="releaseKeyboardFor(releaseEntry)"
                  mode="embedded"
                />
              </div>

              <UButton
                label="Add Variant"
                size="xs"
                variant="soft"
                icon="hugeicons:plus-sign"
                block
                @click="addReleaseVariant(releaseEntry)"
              />
            </div>
          </div>

          <UButton
            label="Add Release"
            size="xs"
            variant="soft"
            icon="hugeicons:plus-sign"
            block
            @click="addRelease"
          />
        </div>
      </template>
    </UStepper>

    <div class="flex items-center justify-between gap-2">
      <UButton
        label="Back"
        variant="soft"
        :disabled="!stepper?.hasPrev"
        @click="stepper?.prev()"
      />

      <UButton
        v-if="stepper?.hasNext"
        label="Next"
        trailing-icon="hugeicons:arrow-right-02"
        :disabled="!canAdvance[active]"
        @click="onNext"
      />

      <div
        v-else-if="mode === 'review'"
        class="flex flex-wrap items-center justify-end gap-2"
      >
        <UButton
          label="Save Changes"
          color="primary"
          :loading="savingAction === 'update'"
          @click="onReviewAction('update')"
        />

        <template v-if="userStore.isModerator">
          <UButton
            label="Approve"
            color="success"
            icon="hugeicons:checkmark-circle-02"
            :loading="savingAction === 'approve'"
            @click="onReviewAction('approve')"
          />

          <UButton
            label="Reject"
            color="error"
            icon="hugeicons:cancel-circle"
            :loading="savingAction === 'reject'"
            @click="onReviewAction('reject')"
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

      <UButton
        v-else
        label="Submit Variants"
        color="primary"
        :loading="uploading"
        @click="onSubmit"
      />
    </div>

    <UModal
      v-if="mode === 'review'"
      v-model:open="deleteVisible"
      title="Delete Submission"
      :description="`Are you sure you want to delete ${keyboard.name}? This action cannot be undone.`"
    >
      <template #footer="{ close }">
        <UButton label="Cancel" @click="close" />
        <UButton
          label="Delete"
          color="error"
          :loading="savingAction === 'delete'"
          @click="onDeleteConfirm(close)"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup>
const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'review'].includes(value),
  },
  submissionId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['onSuccess', 'onDelete'])

const toast = useToast()
const userStore = useUserStore()

const stepper = useTemplateRef('stepper')
const active = ref(0)

const items =
  props.mode === 'review'
    ? [
        { slot: 'brand', title: 'Brand', icon: 'hugeicons:user-multiple' },
        { slot: 'keyboard', title: 'Keyboard', icon: 'hugeicons:keyboard' },
        { slot: 'releases', title: 'Releases', icon: 'hugeicons:package' },
      ]
    : [
        { slot: 'brand', title: 'Brand', icon: 'hugeicons:user-multiple' },
        { slot: 'keyboard', title: 'Keyboard', icon: 'hugeicons:keyboard' },
        { slot: 'release', title: 'Release', icon: 'hugeicons:package' },
        { slot: 'variant', title: 'Variant', icon: 'hugeicons:layers-01' },
      ]

const keyboardModeTabs = [
  { label: 'Choose Existing Keyboard', value: 'existing' },
  { label: 'Propose New Keyboard', value: 'new' },
]

const releaseModeTabs = [
  { label: 'Choose Existing Release', value: 'existing' },
  { label: 'Propose New Release', value: 'new' },
]

const {
  brand,
  brandOptions,
  brandsStatus,
  keyboardMode,
  existingKeyboard,
  keyboardOptions,
  keyboardsStatus,
  keyboard,
  releaseMode,
  existingRelease,
  releaseOptions,
  releasesStatus,
  release,
  variants,
  addVariant,
  removeVariant,
  keyboardForVariantForm,
  releases,
  addRelease,
  removeRelease,
  addReleaseVariant,
  removeReleaseVariant,
  releaseKeyboardFor,
  canDelete,
  load,
  save,
  remove,
  uploading,
  canAdvance,
  validateStep,
  submit,
} = useKeyboardSubmissionWizard({
  mode: props.mode,
  submissionId: props.submissionId,
})

const selectedBrandLabel = computed(
  () => brandOptions.value.find((o) => o.value === brand.value.id)?.label,
)

const selectedKeyboardLabel = computed(
  () =>
    keyboardOptions.value.find((o) => o.value === existingKeyboard.value.id)
      ?.label,
)

const selectedReleaseLabel = computed(
  () =>
    releaseOptions.value.find((o) => o.value === existingRelease.value.id)
      ?.label,
)

onMounted(async () => {
  if (props.mode === 'review') {
    await load()
    active.value = items.length - 1
    return
  }

  if (brand.value.id && existingKeyboard.value.id && existingRelease.value.id) {
    active.value = 3
  } else if (brand.value.id && existingKeyboard.value.id) {
    active.value = 2
  }
})

const onNext = () => {
  if (!validateStep(active.value)) return
  stepper.value?.next()
}

const onSubmit = async () => {
  if (!validateStep(3)) return

  try {
    await submit()
    emit('onSuccess')
  } catch {
    // toasted inside the composable
  }
}

const validateAllSteps = () => {
  for (let i = 0; i < items.length; i++) {
    if (!validateStep(i)) return false
  }

  return true
}

const savingAction = ref(null)
const deleteVisible = ref(false)

const onReviewAction = async (action) => {
  if ((action === 'update' || action === 'approve') && !validateAllSteps()) {
    return
  }

  savingAction.value = action

  try {
    await save(action)
    toast.add(handleSuccess('save', keyboard.value.name, 'Keyboard'))
    emit('onSuccess')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    savingAction.value = null
  }
}

const onDeleteConfirm = async (close) => {
  savingAction.value = 'delete'

  try {
    await remove()

    toast.add(handleSuccess('delete', keyboard.value.name))
    deleteVisible.value = false
    close()
    emit('onDelete')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    savingAction.value = null
  }
}
</script>
