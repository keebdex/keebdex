/**
 * A record opened from a list through the URL (`?color=<id>`), so it can be
 * linked: `select` sets or clears the query, `open` follows it (for a
 * drawer's `v-model:open`), and `id` keeps the last one while the drawer
 * slides closed, so its content does not blank out.
 */
export function useQuerySelection(name: string) {
  const route = useRoute()
  const router = useRouter()

  const current = computed(() => Number(route.query[name]) || null)
  const id = ref(current.value)

  watch(current, (value) => {
    if (value) id.value = value
  })

  function select(item: { id: number } | null) {
    router.replace({
      path: route.path,
      query: { ...route.query, [name]: item?.id || undefined },
    })
  }

  const open = computed({
    get: () => !!current.value,
    set: (value) => {
      if (!value) select(null)
    },
  })

  return { id, open, select }
}
