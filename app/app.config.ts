export default defineAppConfig({
  ui: {
    icons: {
      arrowDown: 'solar:arrow-down-linear',
      arrowLeft: 'solar:arrow-left-linear',
      arrowRight: 'solar:arrow-right-linear',
      arrowUp: 'solar:arrow-up-linear',
      check: 'solar:check-bold-duotone',
      chevronDoubleLeft: 'solar:double-alt-arrow-left-linear',
      chevronDoubleRight: 'solar:double-alt-arrow-right-linear',
      chevronDown: 'solar:alt-arrow-down-linear',
      chevronLeft: 'solar:alt-arrow-left-linear',
      chevronRight: 'solar:alt-arrow-right-linear',
      chevronUp: 'solar:alt-arrow-up-linear',
      close: 'solar:close-bold-duotone',
      external: 'solar:arrow-right-up-linear',
      search: 'solar:magnifer-bold-duotone',
      system: 'solar:monitor-bold-duotone',
      light: 'solar:sun-bold-duotone',
      dark: 'solar:moon-bold-duotone',
      ellipsis: 'solar:menu-dots-bold-duotone',
      file: 'solar:file-bold-duotone',
      folder: 'solar:folder-bold-duotone',
      folderOpen: 'solar:folder-open-bold-duotone',
      loading: 'solar:refresh-bold-duotone',
      minus: 'solar:minus-bold-duotone',
      plus: 'solar:add-bold-duotone',
      upload: 'solar:upload-bold-duotone',
      caution: 'solar:danger-circle-bold-duotone',
      copy: 'solar:copy-bold-duotone',
      copyCheck: 'solar:copy-check-bold-duotone',
      error: 'solar:close-circle-bold-duotone',
      eye: 'solar:eye-bold-duotone',
      eyeOff: 'solar:eye-closed-bold-duotone',
      hash: 'solar:hashtag-bold-duotone',
      info: 'solar:info-circle-bold-duotone',
      menu: 'solar:hamburger-menu-linear',
      panelClose: 'solar:panel-left-close-bold-duotone',
      panelOpen: 'solar:panel-left-open-bold-duotone',
      reload: 'solar:restart-bold-duotone',
      stop: 'solar:stop-linear',
      success: 'solar:check-circle-bold-duotone',
      tip: 'solar:lightbulb-bold-duotone',
      warning: 'solar:danger-triangle-bold-duotone',
      sortNumberAsc: 'solar:sort-from-top-to-bottom-bold-duotone',
      sortNumberDesc: 'solar:sort-from-bottom-to-top-bold-duotone',
      sortAlphaAsc: 'solar:sort-by-alphabet-bold-duotone',
      sortAlphaDesc: 'solar:sort-from-bottom-to-top-bold-duotone',
      sortManual: 'solar:sort-linear',
      drag: 'solar:reorder-linear',
      star: 'solar:star-bold-duotone',
    },
    alert: {
      defaultVariants: {
        variant: 'soft',
      },
    },
    badge: {
      defaultVariants: {
        color: 'neutral',
        variant: 'soft',
      },
    },
    // On very wide screens a panel's content stops at --container-panel
    // (main.css), centered. It is padding, not a max width, so the scrollbar
    // stays at the panel's edge
    dashboardPanel: {
      slots: {
        body: 'lg:px-[max(--spacing(6),calc((100%-var(--container-panel))/2))]',
      },
    },
    // Below lg the menu button sits on the right of every navbar, leaving the
    // left to the title or a back button, and the menu's close button matches
    dashboardNavbar: {
      defaultVariants: {
        toggleSide: 'right',
      },
    },
    dashboardSidebar: {
      defaultVariants: {
        toggleSide: 'right',
      },
    },
    button: {
      slots: {
        base: 'cursor-pointer',
        label: 'hidden md:block',
      },
      compoundVariants: [
        {
          leading: false,
          trailing: false,
          class: {
            label: 'block',
          },
        },
      ],
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
    modal: {
      slots: {
        content: 'divide-none',
        body: '!pt-0',
        footer: 'justify-end',
      },
      variants: {
        // The width lives in this variant, not the content slot; the rest of
        // the classes repeat the Nuxt UI default (max-w-lg there).
        fullscreen: {
          false: {
            content:
              'w-[calc(100vw-2rem)] max-w-xl rounded-lg shadow-lg ring ring-default',
          },
        },
      },
    },
    radioGroup: {
      slots: {
        fieldset: 'gap-x-4',
        description: 'text-xs',
      },
    },
    pageCard: {
      slots: {
        // Wrap actions instead of widening narrow grid cards; span the card,
        // since the wrapper's items-start would shrink the footer to its
        // content. Above the link overlay a card with `to` draws, so its
        // footer buttons stay clickable.
        footer: 'relative z-10 flex flex-wrap gap-2 w-full',
        container: 'p-3 sm:p-4',
      },
    },
    empty: {
      defaultVariants: {
        variant: 'naked',
      },
    },
    pageColumns: {
      base: 'gap-4',
    },
    pageCTA: {
      defaultVariants: {
        variant: 'naked',
      },
    },
    pageGrid: {
      base: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4',
    },
    pageHeader: {
      slots: {
        root: 'pt-0',
        description: 'text-md text-justify',
      },
    },
    pageSection: {
      slots: {
        container: 'py-8 sm:py-12 lg:py-16',
      },
    },
    marquee: {
      slots: {
        root: 'max-w-(--ui-container)',
      },
    },
    // Item bodies in the page's text, set apart from the title: the default
    // muted, small text would reach what they hold (cards, rows), which some
    // themes color apart from other pages
    timeline: {
      slots: {
        description: 'mt-3 text-default',
      },
    },
    // Arrows inside the slides, not beside them, at every width (the
    // position is set by the orientation variant, not the slot)
    carousel: {
      variants: {
        orientation: {
          horizontal: {
            prev: 'start-2 sm:start-2',
            next: 'end-2 sm:end-2',
          },
        },
      },
    },
    select: {
      slots: {
        content: 'min-w-fit',
      },
    },
  },
})
