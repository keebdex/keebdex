import type { ComputedRef, Ref } from 'vue'

type ReviewAction = 'update' | 'approve' | 'reject'

/**
 * Stepper navigation and footer actions shared by the submission wizards
 * (`app/components/{artisan,keyset,keyboard}/modal/SubmissionWizard.vue`).
 * `wizard` is the domain composable (`use*SubmissionWizard`). Returns a
 * reactive object for the template and `SharedSubmissionWizardFooter`; the
 * stepper is bound through `ref="stepper"`.
 */
export const useSubmissionWizardActions = ({
  mode,
  entity,
  label,
  stepCount,
  reviewStep,
  createStep,
  wizard,
  emit,
}: {
  mode: SubmissionWizardMode
  // e.g. 'Kit', for toasts and the delete confirmation.
  entity: string
  // Names the reviewed leaf, e.g. "GMK Olivia - Base".
  label: () => string | undefined
  stepCount: number
  // Step to land on once a review has loaded.
  reviewStep: () => number
  // Step to start on when creating (direct links skip pre-filled steps).
  createStep: () => number
  wizard: {
    load: () => Promise<void>
    save: (action: ReviewAction) => Promise<void>
    remove: () => Promise<unknown>
    submit: () => Promise<unknown>
    validateStep: (index: number) => boolean
    reviewStatus: Ref<string | null>
    canSave: ComputedRef<boolean>
    canDelete: ComputedRef<boolean>
    uploading: Ref<boolean>
    canAdvance: ComputedRef<boolean[]>
  }
  emit: (event: 'onSuccess' | 'onDelete', ...args: any[]) => void
}) => {
  const toast = useToast()
  const userStore = useUserStore()

  const stepper = useTemplateRef<any>('stepper')
  const active = ref(0)
  const reviewLoaded = ref(false)
  const savingAction = ref<ReviewAction | 'delete' | null>(null)

  // Images upload as soon as they're picked, so saving waits for them.
  const uploadingImageKeys = reactive(new Set<string>())
  const hasUploadingImages = computed(() => uploadingImageKeys.size > 0)
  const setImageUploading = (key: string | number, isUploading: boolean) => {
    if (isUploading) uploadingImageKeys.add(String(key))
    else uploadingImageKeys.delete(String(key))
  }

  const canAdvanceStep = computed(
    () =>
      !!wizard.canAdvance.value[active.value] &&
      (mode !== 'review' || reviewLoaded.value),
  )

  const reviewBusy = computed(
    () =>
      !reviewLoaded.value || !!savingAction.value || hasUploadingImages.value,
  )

  onMounted(async () => {
    if (mode !== 'review') {
      active.value = createStep()
      return
    }

    try {
      await wizard.load()
      active.value = reviewStep()
      reviewLoaded.value = true
    } catch (error) {
      toast.add(errorToast(error, { showOriginalMessage: true }))
    }
  })

  const onNext = () => {
    if (!wizard.validateStep(active.value)) return
    stepper.value?.next()
  }

  const onSubmit = async () => {
    if (hasUploadingImages.value || !wizard.validateStep(stepCount - 1)) {
      return
    }

    try {
      await wizard.submit()
      emit('onSuccess')
    } catch {
      // toasted inside the composable
    }
  }

  const onReviewAction = async (action: ReviewAction) => {
    if (reviewBusy.value) return

    // Every step but the locked first one (maker/profile/brand) is editable.
    for (let step = 1; step < stepCount; step++) {
      if (!wizard.validateStep(step)) return
    }

    savingAction.value = action

    try {
      await wizard.save(action)

      toast.add(successToast(action, { entity, name: label() }))
      // A submitter's edit sends a rejected submission back to Pending.
      emit('onSuccess', {
        resubmitted:
          !userStore.isModerator && wizard.reviewStatus.value === 'Rejected',
      })
    } catch (error) {
      toast.add(errorToast(error, { showOriginalMessage: true }))
    } finally {
      savingAction.value = null
    }
  }

  // Resolves to whether the delete succeeded, so the confirmation can close.
  const onDeleteConfirm = async () => {
    if (savingAction.value) return false

    savingAction.value = 'delete'

    try {
      await wizard.remove()

      toast.add(successToast('delete', { entity, name: label() }))
      emit('onDelete')
      return true
    } catch (error) {
      toast.add(errorToast(error, { showOriginalMessage: true }))
      return false
    } finally {
      savingAction.value = null
    }
  }

  return reactive({
    mode,
    entity,
    label: computed(label),
    stepper,
    active,
    reviewLoaded,
    savingAction,
    reviewBusy,
    hasUploadingImages,
    setImageUploading,
    canAdvanceStep,
    canSave: wizard.canSave,
    canDelete: wizard.canDelete,
    uploading: wizard.uploading,
    onNext,
    onSubmit,
    onReviewAction,
    onDeleteConfirm,
  })
}

export type SubmissionWizardActions = ReturnType<
  typeof useSubmissionWizardActions
>
