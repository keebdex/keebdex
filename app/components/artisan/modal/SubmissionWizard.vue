<template>
  <div class="space-y-6">
    <UStepper
      ref="stepper"
      v-model="active"
      :items="items"
      disabled
      class="w-full"
    >
      <template #maker>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Pick the maker this colorway belongs to.
          </p>

          <USelectMenu
            v-model="maker.id"
            :items="makerOptions"
            :loading="makersStatus === 'pending'"
            :disabled="mode === 'review'"
            value-key="value"
            label-key="label"
            placeholder="Select a maker"
            class="w-full"
          />
        </div>
      </template>

      <template #sculpt>
        <div class="space-y-4">
          <UTabs
            v-if="mode === 'create' && sculptOptions.length"
            v-model="sculptMode"
            :items="sculptModeTabs"
            size="sm"
          />

          <p
            v-if="mode === 'review' && sculptReviewStatus"
            class="text-sm text-muted"
          >
            This sculpt was proposed together with the colorway below and is
            still under review — review and edit it here before approving.
          </p>

          <USelectMenu
            v-if="sculptMode === 'existing'"
            v-model="existingSculpt.id"
            :items="sculptOptions"
            :loading="sculptsStatus === 'pending'"
            :disabled="mode === 'review'"
            value-key="value"
            label-key="label"
            placeholder="Select a sculpt"
            class="w-full"
          />

          <ArtisanModalSculptForm
            v-if="sculptMode === 'new'"
            v-model="sculpt"
            :sculpts="sculpts"
            mode="embedded"
          />
        </div>
      </template>

      <template #colorway>
        <div class="space-y-4">
          <p v-if="mode === 'create'" class="text-sm text-muted">
            Add one or more colorways for this sculpt.
          </p>

          <div
            v-for="(colorway, index) in colorways"
            :key="colorway._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-dimmed">
                Colorway #{{ index + 1 }}
              </p>

              <UButton
                v-if="mode === 'create'"
                aria-label="Remove colorway"
                size="xs"
                color="error"
                variant="ghost"
                icon="hugeicons:delete-02"
                :disabled="colorways.length === 1"
                @click="removeColorway(index)"
              />
            </div>

            <ArtisanModalColorwayForm
              v-model="colorways[index]"
              :maker-id="maker.id"
              mode="embedded"
              @update:uploading="
                setImageUploading(String(colorway._key ?? index), $event)
              "
            />
          </div>

          <UButton
            v-if="mode === 'create'"
            label="Add Colorway"
            size="xs"
            variant="soft"
            icon="hugeicons:plus-sign"
            block
            @click="addColorway"
          />
        </div>
      </template>
    </UStepper>

    <div class="flex items-center justify-between gap-2">
      <UButton
        label="Back"
        variant="soft"
        :disabled="!stepper?.hasPrev || !!savingAction"
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
        v-else-if="mode === 'create'"
        label="Submit Colorway"
        color="primary"
        :loading="uploading"
        :disabled="hasUploadingImages"
        @click="onSubmit"
      />
    </div>

    <SharedConfirmModal
      v-if="mode === 'review'"
      v-model:open="deleteVisible"
      title="Delete Colorway"
      :description="`Are you sure you want to delete ${colorways[0]?.name || 'this colorway'}? This action cannot be undone.`"
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

const sculptModeTabs = [
  { label: 'Choose Existing Sculpt', value: 'existing' },
  { label: 'Propose New Sculpt', value: 'new' },
]

const {
  maker,
  makerOptions,
  makersStatus,
  sculptMode,
  existingSculpt,
  sculptOptions,
  sculptsStatus,
  sculpts,
  sculpt,
  colorways,
  addColorway,
  removeColorway,
  reviewStatus,
  sculptReviewStatus,
  canSave,
  canDelete,
  load,
  save,
  remove,
  uploading,
  canAdvance,
  validateStep,
  submit,
} = useArtisanSubmissionWizard({
  mode: props.mode,
  submission: props.submission,
})

const uploadingImageKeys = reactive(new Set())
const hasUploadingImages = computed(() => uploadingImageKeys.size > 0)
const setImageUploading = (key, isUploading) => {
  if (isUploading) uploadingImageKeys.add(key)
  else uploadingImageKeys.delete(key)
}

const selectedMakerLabel = computed(
  () => makerOptions.value.find((o) => o.value === maker.value.id)?.label,
)

const selectedSculptLabel = computed(
  () =>
    sculptOptions.value.find((o) => o.value === existingSculpt.value.id)?.label,
)

const selectedSculptContextLabel = computed(() =>
  sculptMode.value === 'new' ? sculpt.value.name : selectedSculptLabel.value,
)

const items = computed(() => [
  {
    slot: 'maker',
    title: 'Maker',
    description: selectedMakerLabel.value,
    icon: 'hugeicons:user-multiple',
  },
  {
    slot: 'sculpt',
    title: 'Sculpt',
    icon: 'hugeicons:dashboard-square-02',
    description: selectedSculptContextLabel.value,
  },
  {
    slot: 'colorway',
    title: 'Colorway',
    icon: 'hugeicons:paint-board',
  },
])

const reviewLoaded = ref(false)

onMounted(async () => {
  if (props.mode === 'review') {
    try {
      await load()
      active.value = sculptReviewStatus.value ? 1 : 2
      reviewLoaded.value = true
    } catch (error) {
      toast.add(handleError(error, { showOriginalMessage: true }))
    }
    return
  }

  if (maker.value.id && existingSculpt.value.id) {
    active.value = 2
  }
})

const onNext = () => {
  if (!validateStep(active.value)) return
  stepper.value?.next()
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
  if (!validateStep(1) || !validateStep(2)) return

  savingAction.value = action

  try {
    await save(action)

    toast.add(
      handleSuccess(
        action === 'approve' ? 'approve' : 'save',
        colorways.value[0]?.name,
        'Colorway',
      ),
    )
    // A submitter's edit sends a rejected colorway back to the Pending queue.
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

    toast.add(handleSuccess('delete', colorways.value[0]?.name, 'Colorway'))
    deleteVisible.value = false
    emit('onDelete')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    savingAction.value = null
  }
}

const onSubmit = async () => {
  if (hasUploadingImages.value || !validateStep(2)) return

  try {
    await submit()
    emit('onSuccess')
  } catch {
    // toasted inside the composable
  }
}
</script>
