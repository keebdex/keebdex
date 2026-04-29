interface UseGuardedSearchOptions {
  key?: string
  term: Ref<string>
  minLength?: number
  immediate?: boolean
  module?: string
}

/**
 * Composable for handling guarded API searches with minimum term length validation.
 * Uses SEARCH_TERM_MIN_LENGTH constant to maintain consistent search behavior.
 * Query always includes 'term' parameter. Module is optional.
 * Returned data mirrors the endpoint response shape. When the term is shorter
 * than `minLength`, this composable returns `null`.
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
    key,
    term: searchTerm,
    minLength = SEARCH_TERM_MIN_LENGTH,
    immediate = false,
    module,
  } = options

  const cacheKey = key || (module ? `${endpoint}-${module}` : endpoint)

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

  const { data, status, refresh } = useAsyncData(
    cacheKey,
    () => {
      if (!shouldSearch.value) {
        return Promise.resolve(null)
      }
      return $fetch(endpoint, { query: query.value })
    },
    {
      immediate,
      default: () => null,
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
