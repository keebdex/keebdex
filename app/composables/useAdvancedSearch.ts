interface UseAdvancedSearchOptions {
  key?: string
  term: Ref<string>
  minLength?: number
  immediate?: boolean
  pagination?: {
    page: Ref<number> | number
    size: Ref<number> | number
  }
  filters?: Record<string, any>
}

const normalizeSearchResult = (result: any, page: number, size: number) => {
  if (Array.isArray(result)) {
    return {
      data: result,
      count: result.length,
      page,
      size,
    }
  }

  if (!result || typeof result !== 'object') {
    return {
      data: [],
      count: 0,
      page,
      size,
    }
  }

  const arrayKey = Array.isArray(result.data)
    ? 'data'
    : Object.keys(result).find((key) => Array.isArray(result[key]))

  return {
    data: arrayKey ? result[arrayKey] || [] : [],
    count: Number(result.count) || 0,
    page: Number(result.page) || page,
    size: Number(result.size) || size,
  }
}

export const useAdvancedSearch = (
  endpoint: string,
  options: UseAdvancedSearchOptions,
) => {
  const {
    key,
    term: searchTerm,
    minLength = SEARCH_TERM_MIN_LENGTH,
    immediate = true,
    pagination,
    filters,
  } = options

  const cacheKey = key || endpoint

  const normalizedTerm = computed(() => searchTerm.value.trim())
  const currentPage = computed(() => Number(unref(pagination?.page)) || 1)
  const pageSize = computed(() => Number(unref(pagination?.size)) || 10)
  const defaultValue = computed(() => ({
    data: [],
    count: 0,
    page: currentPage.value,
    size: pageSize.value,
  }))
  const shouldSearch = computed(() => {
    return (
      normalizedTerm.value.length === 0 ||
      normalizedTerm.value.length >= minLength
    )
  })

  const queryParams = computed(() => {
    const query: Record<string, any> = {
      term: normalizedTerm.value,
    }

    if (pagination) {
      query.page = unref(pagination.page)
      query.size = unref(pagination.size)
    }

    if (filters) {
      Object.entries(filters).forEach(([filterKey, value]) => {
        query[filterKey] = unref(value)
      })
    }

    return query
  })

  const { data, status, refresh } = useAsyncData(
    cacheKey,
    () => {
      if (!shouldSearch.value) {
        return Promise.resolve(defaultValue.value)
      }

      return $fetch(endpoint, { query: queryParams.value }).then((result) =>
        normalizeSearchResult(result, currentPage.value, pageSize.value),
      )
    },
    {
      immediate,
      default: () => defaultValue.value,
      watch: [queryParams],
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
