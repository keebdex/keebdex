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
        </div>
      </template>

      <template #keyboard>
        <div v-if="mode === 'review' && !keyboardUnderReview" class="space-y-2">
          <p class="text-sm text-muted">
            This keyboard is already published. Only the variant is reviewed
            here.
          </p>

          <NuxtLink
            :to="`/keyboard/brand/${existingKeyboard.id}`"
            class="text-sm font-medium text-primary hover:underline"
          >
            {{ keyboard.name }}
          </NuxtLink>
        </div>

        <div v-else class="space-y-4">
          <p v-if="mode === 'review'" class="text-sm text-muted">
            This keyboard is still under review — review and edit it here before
            approving.
          </p>

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

          <KeyboardModalKeyboardForm
            v-if="mode === 'review' || keyboardMode === 'new'"
            v-model="keyboard"
            :is-edit="mode === 'review'"
            mode="embedded"
          />
        </div>
      </template>

      <template #release>
        <div v-if="mode === 'review'" class="space-y-4">
          <p v-if="!releaseUnderReview" class="text-sm">
            <strong>{{ release.name }}</strong>
            <span class="text-muted">
              is already published. Only the variant is reviewed here.
            </span>
          </p>

          <template v-else>
            <p class="text-sm text-muted">
              This release is still under review — review and edit it here
              before approving.
            </p>

            <KeyboardModalReleaseForm
              v-model="release"
              :keyboard="{ releases: [] }"
              mode="embedded"
            />
          </template>
        </div>

        <div v-else class="space-y-4">
          <UTabs
            v-if="
              keyboardMode === 'existing' &&
              releaseOptions.length &&
              !isDirectReleaseEntry
            "
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

          <KeyboardModalReleaseForm
            v-if="releaseMode === 'new'"
            v-model="release"
            :keyboard="{ releases: [] }"
            mode="embedded"
          />
        </div>
      </template>

      <template #variant>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{
              mode === 'review'
                ? 'Review and edit this variant.'
                : 'Add one or more variants for this release.'
            }}
          </p>

          <div
            v-for="(variant, index) in variants"
            :key="variant._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <p class="text-xs font-medium text-dimmed">
                  Variant #{{ index + 1 }}
                </p>

                <UBadge
                  v-if="mode === 'review' && reviewStatus"
                  :label="reviewStatus"
                  variant="subtle"
                  size="xs"
                  :color="statusColorMap[reviewStatus] || 'neutral'"
                />
              </div>

              <UButton
                v-if="mode === 'create'"
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
              @update:uploading="
                setImageUploading(
                  `variant-${variants[index]._key ?? variants[index].id ?? index}`,
                  $event,
                )
              "
            />
          </div>

          <UButton
            v-if="mode === 'create'"
            label="Add Variant"
            size="xs"
            variant="soft"
            icon="hugeicons:plus-sign"
            block
            @click="addVariant"
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
        :disabled="!canAdvance[active] || (mode === 'review' && !reviewLoaded)"
        @click="onNext"
      />

      <div
        v-else-if="mode === 'review'"
        class="flex flex-wrap items-center justify-end gap-2"
      >
        <UButton
          v-if="canSave && !userStore.isModerator"
          label="Save Changes"
          color="primary"
          :loading="savingAction === 'update'"
          :disabled="!reviewLoaded || !!savingAction || hasUploadingImages"
          @click="onReviewAction('update')"
        />

        <UButton
          v-if="userStore.isModerator"
          label="Save & Approve"
          color="success"
          icon="hugeicons:checkmark-circle-02"
          :loading="savingAction === 'approve'"
          :disabled="!reviewLoaded || !!savingAction || hasUploadingImages"
          @click="onReviewAction('approve')"
        />

        <UButton
          v-if="canDelete"
          label="Delete"
          color="error"
          variant="soft"
          icon="hugeicons:delete-02"
          :disabled="!reviewLoaded || !!savingAction || hasUploadingImages"
          @click="deleteVisible = true"
        />
      </div>

      <UButton
        v-else
        label="Submit Variants"
        color="primary"
        :loading="uploading"
        :disabled="hasUploadingImages"
        @click="onSubmit"
      />
    </div>

    <SharedConfirmModal
      v-if="mode === 'review'"
      v-model:open="deleteVisible"
      title="Delete Variant"
      :description="`Are you sure you want to delete ${variantLabel}? This action cannot be undone.`"
      :loading="savingAction === 'delete'"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'review'].includes(value),
  },
  // In review mode: the variant row from GET /api/submissions/keyboard.
  submission: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['onSuccess', 'onDelete'])

const toast = useToast()
const userStore = useUserStore()

const stepper = useTemplateRef('stepper')
const active = ref(0)

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
  isDirectReleaseEntry,
  existingRelease,
  releaseOptions,
  releasesStatus,
  release,
  variants,
  addVariant,
  removeVariant,
  keyboardForVariantForm,
  reviewStatus,
  keyboardUnderReview,
  releaseUnderReview,
  canSave,
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
  submission: props.submission,
})

const uploadingImageKeys = reactive(new Set())
const hasUploadingImages = computed(() => uploadingImageKeys.size > 0)
const setImageUploading = (key, isUploading) => {
  if (isUploading) uploadingImageKeys.add(key)
  else uploadingImageKeys.delete(key)
}

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

const selectedKeyboardContextLabel = computed(() =>
  props.mode === 'review' || keyboardMode.value === 'new'
    ? keyboard.value.name
    : selectedKeyboardLabel.value,
)

const selectedReleaseContextLabel = computed(() =>
  props.mode === 'review' || releaseMode.value === 'new'
    ? release.value.name
    : selectedReleaseLabel.value,
)

const items = computed(() => [
  {
    slot: 'brand',
    title: 'Brand',
    description: selectedBrandLabel.value,
    icon: 'hugeicons:user-multiple',
  },
  {
    slot: 'keyboard',
    title: 'Keyboard',
    icon: 'hugeicons:keyboard',
    description: selectedKeyboardContextLabel.value,
  },
  {
    slot: 'release',
    title: 'Release',
    icon: 'hugeicons:package',
    description: selectedReleaseContextLabel.value,
  },
  {
    slot: 'variant',
    title: 'Variant',
    icon: 'hugeicons:layers-01',
  },
])

const variantLabel = computed(() =>
  [keyboard.value.name, release.value.name, variants.value[0]?.variant_name]
    .filter(Boolean)
    .join(' - '),
)

const reviewLoaded = ref(false)

onMounted(async () => {
  if (props.mode === 'review') {
    try {
      await load()
      // Land on the highest level that is still under review; a published
      // keyboard and release leave just the variant.
      active.value = keyboardUnderReview.value
        ? 1
        : releaseUnderReview.value
          ? 2
          : 3
      reviewLoaded.value = true
    } catch (error) {
      toast.add(handleError(error, { showOriginalMessage: true }))
    }
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
  if (hasUploadingImages.value || !validateStep(3)) return

  try {
    await submit()
    emit('onSuccess')
  } catch {
    // toasted inside the composable
  }
}

const savingAction = ref(null)
const deleteVisible = ref(false)

const onReviewAction = async (action) => {
  if (
    !reviewLoaded.value ||
    savingAction.value ||
    hasUploadingImages.value
  ) {
    return
  }

  for (let i = 1; i < items.value.length; i++) {
    if (!validateStep(i)) return
  }

  savingAction.value = action

  try {
    await save(action)

    toast.add(
      handleSuccess(
        action === 'approve' ? 'approve' : 'save',
        variantLabel.value,
        'Variant',
      ),
    )
    // A submitter's edit sends a rejected variant back to the Pending queue.
    emit('onSuccess', {
      resubmitted: !userStore.isModerator && reviewStatus.value === 'Rejected',
    })
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    savingAction.value = null
  }
}

const onDeleteConfirm = async () => {
  if (savingAction.value) return

  savingAction.value = 'delete'

  try {
    await remove()

    toast.add(handleSuccess('delete', variantLabel.value, 'Variant'))
    deleteVisible.value = false
    emit('onDelete')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    savingAction.value = null
  }
}
</script>
