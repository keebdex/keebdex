export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: 'cursor-pointer',
      },
      defaultVariants: {
        color: 'neutral',
        variant: 'soft',
      },
    },
  },
  uiPro: {
    pageGrid: {
      base: 'relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4',
    },
  },
})
