import type { SuggestionEntityType } from '~/utils/suggestions'

/**
 * Edit for signed-in users who cannot edit a detail page themselves: their
 * Edit buttons suggest changes to its published records through one
 * `SharedSuggestEditModal`, bound to `target` and `open`. `formProps` are
 * extra props for the record's form (e.g. option lists the page has).
 */
export const useSuggestEdit = (editable: MaybeRefOrGetter<boolean>) => {
  const { authenticated } = storeToRefs(useUserStore())

  const target = ref<{
    entityType: SuggestionEntityType
    record: Record<string, any>
    formProps?: Record<string, unknown>
  } | null>(null)
  const open = ref(false)

  const canSuggest = (record?: Record<string, any> | null) =>
    authenticated.value && !toValue(editable) && isSuggestable(record ?? undefined)

  const suggest = (
    entityType: SuggestionEntityType,
    record: Record<string, any>,
    formProps?: Record<string, unknown>,
  ) => {
    target.value = { entityType, record, formProps }
    open.value = true
  }

  return { target, open, canSuggest, suggest }
}
