const createDefaultTradingConfig = (social: Record<string, string> = {}) => ({
  selling: {
    collection: undefined,
    title: '',
    placeholder: 'WTS/WTT',
  },
  buying: {
    collection: undefined,
    title: '',
    placeholder: 'WTB/WTTF',
  },
  social: {
    discord: social.discord,
    reddit: social.reddit,
    qq: social.qq,
  },
  type: 'buying',
  fnf_only: false,
  shipping_included: false,
  columns: 5,
})

export const useTradingConfig = () => {
  const userStore = useUserStore()

  return useState('trading-config', () =>
    createDefaultTradingConfig(userStore.social),
  )
}

export { createDefaultTradingConfig }

/** The kinds of list a wishlist image can be, in the order they are offered. */
export const WISHLIST_TYPE_ITEMS = [
  { label: 'Buying', value: 'buying' },
  { label: 'Selling', value: 'selling' },
  { label: 'Trading', value: 'trading' },
]

// Collection intents each list type draws from; a trading list's Have
// section draws from the selling ones
const WISHLIST_INTENTS: Record<string, string[]> = {
  buying: ['keep', 'want'],
  selling: ['keep', 'sell'],
  trading: ['keep', 'want'],
}

/**
 * The list type and collection pickers' logic, shared by the settings and
 * the start screen: the user's artisan collections that fit a list type, and
 * a type change, which clears the picked collections, titles, and terms.
 */
export const useWishlistPicker = () => {
  const { collections } = storeToRefs(useUserStore())
  const config = useTradingConfig()

  const collectionItems = (type: string) =>
    collections.value.filter(
      (c: any) =>
        c.category === 'artisan' && WISHLIST_INTENTS[type]?.includes(c.intent),
    )

  const setType = (type: string) => {
    const { social, columns } = config.value

    config.value = { ...createDefaultTradingConfig(social), columns, type }
  }

  return { collectionItems, setType }
}
