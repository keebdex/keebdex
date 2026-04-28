interface UseGuardedSearchOptions {
  term: Ref<string>
  minLength?: number
  immediate?: boolean
  module?: string
}

/**
 * Composable for handling guarded API searches with minimum term length validation.
 * Uses SEARCH_TERM_MIN_LENGTH constant to maintain consistent search behavior.
 * Query always includes 'term' parameter. Theme and module are optional.
 * Default value is always { data: [], count: 0 }
 *
 * @example
 * const { data, status } = useGuardedSearch('/api/colors', { term })
 *
 * @example
 * const { data, status } = useGuardedSearch('/api/search', {
 *   term,
 *   module: 'keyboard'
 * })
 */
export const useGuardedSearch = (
  endpoint: string,
  options: UseGuardedSearchOptions,
) => {
  const {
    term: searchTerm,
    minLength = SEARCH_TERM_MIN_LENGTH,
    immediate = false,
    module,
  } = options

  const defaultValue = { data: [], count: 0 }

  const normalizedTerm = computed(() => searchTerm.value.trim())
  const shouldSearch = computed(() => normalizedTerm.value.length >= minLength)

  const query = computed(() => {
    const q: Record<string, string> = {
      term: normalizedTerm.value,
    }

    if (module) {
      q.module = module
    }

    return q
  })

  const key = module ? `${endpoint}:${module}` : endpoint

  const { data, status, refresh } = useAsyncData(
    key,
    () => {
      if (!shouldSearch.value) {
        return Promise.resolve(defaultValue)
      }
      return $fetch(endpoint, { query: query.value })
    },
    {
      immediate,
      default: () => defaultValue,
      watch: [searchTerm],
    },
  )

  return {
    data,
    status,
    refresh,
    normalizedTerm,
    shouldSearch,
  }
}
