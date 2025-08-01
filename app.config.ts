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
    pageCard: {
      slots: {
        footer: 'flex gap-2',
      },
    },
    pageColumns: {
      base: 'md:columns-2 lg:columns-3 2xl:columns-4 4xl:columns-6 gap-4',
    },
    pageGrid: {
      base: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 4xl:grid-cols-9 gap-4',
    },
    pageHeader: {
      slots: {
        root: 'pt-0',
        description: 'text-md text-justify',
      },
    },
  },
})
