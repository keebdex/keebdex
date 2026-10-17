import type { SuggestionEntityType } from '~/utils/suggestions'

/**
 * Suggest Edit on a detail page: signed-in users who cannot edit the page
 * themselves suggest changes to its published records through one
 * `SharedSuggestEditModal`, bound to `target` and `open`.
 */
export const useSuggestEdit = (editable: MaybeRefOrGetter<boolean>) => {
  const { authenticated } = storeToRefs(useUserStore())

  const target = ref<{
    entityType: SuggestionEntityType
    record: Record<string, any>
    focus?: string
  } | null>(null)
  const open = ref(false)

  const canSuggest = (record?: Record<string, any> | null) =>
    authenticated.value && !toValue(editable) && isSuggestable(record ?? undefined)

  const suggest = (
    entityType: SuggestionEntityType,
    record: Record<string, any>,
    focus?: string,
  ) => {
    target.value = { entityType, record, focus }
    open.value = true
  }

  return { target, open, canSuggest, suggest }
}
