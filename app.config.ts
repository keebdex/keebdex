export default defineAppConfig({
  ui: {
    icons: {
      arrowDown: 'hugeicons:arrow-down-02',
      arrowLeft: 'hugeicons:arrow-left-02',
      arrowRight: 'hugeicons:arrow-right-02',
      arrowUp: 'hugeicons:arrow-up-02',
      check: 'hugeicons:tick-01',
      chevronDoubleLeft: 'hugeicons:arrow-left-double',
      chevronDoubleRight: 'hugeicons:arrow-right-double',
      chevronDown: 'hugeicons:arrow-down-01',
      chevronLeft: 'hugeicons:arrow-left-01',
      chevronRight: 'hugeicons:arrow-right-01',
      chevronUp: 'hugeicons:arrow-up-01',
      close: 'hugeicons:cancel-01',
      external: 'hugeicons:arrow-up-right-01',
      search: 'hugeicons:search-01',
      system: 'hugeicons:computer',
      light: 'hugeicons:sun-02',
      dark: 'hugeicons:moon-02',
    },
    button: {
      slots: {
        base: 'cursor-pointer',
      },
      defaultVariants: {
        color: 'neutral',
        variant: 'soft',
      },
    },
    formField: {
      slots: {
        help: 'text-xs',
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
