export function usePagination(size: number) {
  const route = useRoute()
  const router = useRouter()

  const page = computed(() => Number(route.query.page) || 1)

  function setPage(newPage: number) {
    router.push({ path: route.path, query: { ...route.query, page: newPage } })
  }

  function resetPage() {
    if (page.value !== 1) {
      router.replace({
        path: route.path,
        query: { ...route.query, page: undefined },
      })
    }
  }

  return { page, size, setPage, resetPage }
}
