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
        <div v-if="childrenOnly" class="space-y-2">
          <p class="text-sm text-muted">
            This keyboard is already published. Only the releases and variants
            proposed for it are reviewed here.
          </p>

          <NuxtLink
            :to="`/keyboard/brand/${existingKeyboard.id}`"
            class="text-sm font-medium text-primary hover:underline"
          >
            {{ keyboard.name }}
          </NuxtLink>
        </div>

        <div v-else class="space-y-4">
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
            mode="embedded"
          />
        </div>
      </template>

      <template #release>
        <div class="space-y-4">
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
            {{
              childrenOnly
                ? 'Review and edit the releases and variants proposed for this keyboard.'
                : 'Review and edit the releases and variants included in this submission.'
            }}
          </p>

          <div
            v-for="(releaseEntry, index) in releases"
            :key="releaseEntry._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <p class="text-xs font-medium text-dimmed">
                  Release #{{ index + 1 }}
                </p>

                <UBadge
                  v-if="releaseEntry.review_status"
                  :label="releaseEntry.review_status"
                  variant="subtle"
                  size="xs"
                  :color="
                    statusColorMap[releaseEntry.review_status] || 'neutral'
                  "
                />
              </div>

              <UButton
                v-if="!releaseEntry._locked"
                aria-label="Remove release"
                size="xs"
                color="error"
                variant="ghost"
                icon="hugeicons:delete-02"
                :disabled="releases.length === 1"
                @click="removeRelease(index)"
              />
            </div>

            <p v-if="releaseEntry._locked" class="text-sm">
              <strong>{{ releaseEntry.name }}</strong>
              <span class="text-muted"> is already published.</span>
            </p>

            <KeyboardModalReleaseForm
              v-else
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
                  <div class="flex items-center gap-2">
                    <p class="text-xs text-dimmed">
                      Variant #{{ variantIndex + 1 }}
                    </p>

                    <UBadge
                      v-if="variant.review_status"
                      :label="variant.review_status"
                      variant="subtle"
                      size="xs"
                      :color="
                        statusColorMap[variant.review_status] || 'neutral'
                      "
                    />
                  </div>

                  <UButton
                    aria-label="Remove variant"
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="hugeicons:delete-02"
                    :disabled="
                      !releaseEntry._locked &&
                      releaseEntry.variants.length === 1
                    "
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
            v-if="!childrenOnly"
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
          v-if="!userStore.isModerator"
          label="Save Changes"
          color="primary"
          :loading="savingAction === 'update'"
          @click="onReviewAction('update')"
        />

        <template v-if="userStore.isModerator">
          <UButton
            label="Save & Approve"
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
      :description="
        childrenOnly
          ? `Are you sure you want to delete the releases and variants proposed for ${keyboard.name}? The keyboard itself is kept. This action cannot be undone.`
          : `Are you sure you want to delete ${keyboard.name}? This action cannot be undone.`
      "
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
  // Review only the releases/variants proposed for an already-published keyboard.
  childrenOnly: {
    type: Boolean,
    default: false,
  },
  // `brand_keyboard_slug` of that published keyboard (required with childrenOnly).
  parentKey: {
    type: String,
    default: '',
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
  childrenOnly: props.childrenOnly,
  parentKey: props.parentKey,
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

const selectedKeyboardContextLabel = computed(() =>
  props.mode === 'review' || keyboardMode.value === 'new'
    ? keyboard.value.name
    : selectedKeyboardLabel.value,
)

const selectedReleaseContextLabel = computed(() =>
  releaseMode.value === 'new' ? release.value.name : selectedReleaseLabel.value,
)

const items = computed(() =>
  props.mode === 'review'
    ? [
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
          slot: 'releases',
          title: 'Releases',
          icon: 'hugeicons:package',
          description: selectedReleaseContextLabel.value,
        },
      ]
    : [
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
      ],
)

onMounted(async () => {
  if (props.mode === 'review') {
    await load()
    // A published keyboard isn't under review, so land on its proposed releases.
    active.value = props.childrenOnly ? 2 : 1
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
  for (let i = 0; i < items.value.length; i++) {
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
    toast.add(
      handleSuccess(
        'save',
        keyboard.value.name,
        props.childrenOnly ? 'Release' : 'Keyboard',
      ),
    )
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
