import type { Ref } from 'vue'

export type SubmissionWizardMode = 'create' | 'review'

export type SubmissionWizardOptions = {
  mode?: SubmissionWizardMode
  submission?: Record<string, any> | null
}

type StepResult = {
  success: boolean
  error?: { issues: { message?: string }[] }
}

/**
 * Review-mode state shared by the submission wizards: the status of the leaf
 * being reviewed, and whether the actor may save or delete it. Staff can edit
 * anything; submitters only while it's Pending or Rejected (editing a rejected
 * submission sends it back to review).
 */
export const useSubmissionReview = (mode: SubmissionWizardMode) => {
  const userStore = useUserStore()
  const isReview = mode === 'review'
  const reviewStatus = ref<string | null>(null)

  const canSave = computed(
    () =>
      isReview &&
      (userStore.isModerator ||
        ['Pending', 'Rejected'].includes(reviewStatus.value || '')),
  )

  return { isReview, reviewStatus, canSave, canDelete: canSave }
}

/**
 * Validates a wizard step by index and toasts the first issue on failure.
 */
export const useStepValidation = (steps: (() => StepResult)[]) => {
  const toast = useToast()

  return (index: number) => {
    const result = steps[index]?.()

    if (!result || result.success) return true

    toast.add(handleError({ statusMessage: result.error?.issues[0]?.message }))
    return false
  }
}

/**
 * Repeatable wizard items (colorways, kits, variants) keyed by a stable `_key`
 * for `v-for`. `factory` receives the index the new item will take; there is
 * always at least one item.
 */
export const useRepeatableItems = <T extends Record<string, any>>(
  factory: (index: number) => T,
) => {
  let keySeed = 0

  const create = (fields: Record<string, any> = {}, index = 0) => ({
    _key: keySeed++,
    ...factory(index),
    ...fields,
  })

  const items = ref([create()]) as Ref<(T & { _key: number })[]>

  const add = () => {
    items.value.push(create({}, items.value.length))
  }

  const remove = (index: number) => {
    if (items.value.length > 1) items.value.splice(index, 1)
  }

  // Strips the client-only `_key` before an item is sent to the API.
  const toPayload = ({ _key, ...item }: T & { _key: number }) => item

  return { items, create, add, remove, toPayload }
}
