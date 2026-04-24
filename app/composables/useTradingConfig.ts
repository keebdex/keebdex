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
  highlight_filled: false,
  columns: 5,
})

export const useTradingConfig = () => {
  const userStore = useUserStore()

  return useState('trading-config', () =>
    createDefaultTradingConfig(userStore.social),
  )
}

export { createDefaultTradingConfig }
