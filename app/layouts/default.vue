<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:visible="open"
      v-model:collapsed="collapsed"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header>
        <NuxtLink to="/" class="flex items-center">
          <AppLogo :collapsed="collapsed" />
        </NuxtLink>

        <div v-if="!collapsed" class="flex items-center gap-1.5 ms-auto">
          <UDashboardSidebarCollapse class="text-dimmed" />
        </div>
      </template>

      <template #default>
        <UDashboardSearchButton :collapsed="collapsed" />

        <template v-if="collapsed">
          <UDashboardSidebarCollapse class="text-dimmed" />
        </template>

        <UNavigationMenu
          :key="`routes-${routesMenuKey}`"
          :collapsed="collapsed"
          :items="routes"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer>
        <ProfileMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <KeebSearch :routes="groups" />

    <!-- Panels default to min-h-svh; min-h-0 lets the page shrink under the banner. -->
    <div class="flex flex-col w-full *:min-h-0">
      <UBanner
        v-if="banner"
        :key="banner.key"
        v-bind="bannerProps"
        class="shrink-0"
        @close="announcements.dismiss(banner.key)"
      />

      <slot />
    </div>

    <UModal
      v-model:open="visible.feedback"
      title="Share your thoughts!"
      :ui="{
        body: 'flex flex-col gap-4',
      }"
    >
      <template #body>
        <ModalFeedbackForm @on-success="toggle('feedback')" />
      </template>
    </UModal>

    <UModal v-model:open="visible.donate">
      <template #content>
        <ModalDonate />
      </template>
    </UModal>
  </UDashboardGroup>
</template>

<script setup>
const route = useRoute()
const toast = useToast()
const announcements = useAnnouncements()
const cookieConsent = useCookieConsent()
const userStore = useUserStore()

const { authenticated, isModerator } = storeToRefs(userStore)
const { unread: unreadNotifications } = useNotifications()
const { unread: unreadAnnouncements } = useAnnouncements()

// Personal notifications plus announcements not read yet, so a new
// announcement brings users to the Announcements tab.
const unread = computed(
  () => unreadNotifications.value + unreadAnnouncements.value,
)

const open = ref(false)
const collapsed = ref(false)
const routesMenuKey = ref(0)
const { paletteItems } = useThemeMenu()

const wrapSection = ({
  collapsed,
  label,
  icon,
  active,
  children,
  defaultOpen = true,
}) => {
  if (collapsed) return children

  return [
    {
      label,
      icon,
      type: 'trigger',
      defaultOpen,
      active,
      children,
    },
  ]
}

const routes = computed(() => {
  const isCollapsed = collapsed.value

  const artisanChildren = [
    {
      label: 'Makers',
      icon: 'hugeicons:user-multiple',
      to: '/artisan/maker',
      active: route.path.startsWith('/artisan/maker'),
    },
    {
      label: 'Trading Hub',
      icon: 'hugeicons:store-01',
      to: '/artisan/marketplace',
      active: route.path === '/artisan/marketplace',
    },
    {
      label: 'Wishlist Image',
      icon: 'hugeicons:ai-image',
      to: '/artisan/wishlist',
      active: route.path === '/artisan/wishlist',
    },
  ]

  if (authenticated.value) {
    artisanChildren.push({
      label: 'Submissions',
      icon: 'hugeicons:file-verified',
      to: '/artisan/submissions',
      active: route.path.startsWith('/artisan/submissions'),
    })
  }

  const keyboardChildren = [
    {
      label: 'Brands',
      icon: 'hugeicons:user-multiple',
      to: '/keyboard/brand',
      active:
        route.path === '/keyboard' || route.path.startsWith('/keyboard/brand'),
      exact: false,
    },
  ]

  if (authenticated.value) {
    keyboardChildren.push({
      label: 'Submissions',
      icon: 'hugeicons:file-verified',
      to: '/keyboard/submissions',
      active: route.path.startsWith('/keyboard/submissions'),
    })
  }

  const keysetChildren = [
    {
      label: 'Profiles',
      icon: 'hugeicons:cross',
      to: '/keyset',
      exact: true,
      active:
        route.path === '/keyset' ||
        (route.path.startsWith('/keyset/') &&
          !['/keyset/group-buy', '/keyset/color'].includes(route.path) &&
          !route.path.startsWith('/keyset/submissions')),
    },
    {
      label: 'Group Buys',
      icon: 'hugeicons:live-streaming-02',
      to: '/keyset/group-buy',
      active: route.path === '/keyset/group-buy',
    },
    {
      label: 'Colors',
      icon: 'hugeicons:colors',
      to: '/keyset/color',
      active: route.path === '/keyset/color',
    },
  ]

  if (authenticated.value) {
    keysetChildren.push({
      label: 'Submissions',
      icon: 'hugeicons:file-verified',
      to: '/keyset/submissions',
      active: route.path.startsWith('/keyset/submissions'),
    })
  }

  return [
    [
      {
        label: 'My Collection',
        icon: 'hugeicons:collections-bookmark',
        to: '/collection',
        active: route.path.startsWith('/collection'),
      },
    ],
    wrapSection({
      collapsed: isCollapsed,
      label: 'Artisans',
      icon: 'hugeicons:alien-01',
      active: route.path.startsWith('/artisan'),
      children: artisanChildren,
    }),
    wrapSection({
      collapsed: isCollapsed,
      label: 'Keyboards',
      icon: 'hugeicons:keyboard',
      active: route.path.startsWith('/keyboard'),
      children: keyboardChildren,
    }),
    wrapSection({
      collapsed: isCollapsed,
      label: 'Keysets',
      icon: 'hugeicons:grid-view',
      active: route.path.startsWith('/keyset'),
      children: keysetChildren,
    }),
  ]
})

// Signed-in users only; the dot icon and badge flag unread notifications and
// announcements.
const notificationsLink = computed(() =>
  authenticated.value
    ? [
        {
          label: 'Notifications',
          icon: unread.value
            ? 'hugeicons:bell-dot'
            : 'hugeicons:notification-01',
          // Straight to the Announcements tab when only announcements are new.
          to:
            !unreadNotifications.value && unreadAnnouncements.value
              ? '/notifications?tab=announcements'
              : '/notifications',
          active: route.path === '/notifications',
          badge: unread.value
            ? {
                label: unread.value > 9 ? '9+' : String(unread.value),
                color: 'error',
                variant: 'solid',
                size: 'sm',
              }
            : undefined,
        },
      ]
    : [],
)

// Staff only: revisions of the pages they manage.
const recentChangesLink = computed(() =>
  isModerator.value
    ? [
        {
          label: 'Recent Changes',
          icon: 'hugeicons:time-quarter-pass',
          to: '/recent-changes',
          active: route.path === '/recent-changes',
        },
      ]
    : [],
)

const links = computed(() => [
  [
    ...notificationsLink.value,
    ...recentChangesLink.value,
    {
      label: 'Feedback',
      icon: 'hugeicons:message-question',
      class: 'cursor-pointer',
      onSelect() {
        toggle('feedback')
      },
    },
    {
      label: 'Donate',
      icon: 'hugeicons:paypal',
      class: 'cursor-pointer text-donator hover:text-donator',
      ui: {
        linkLeadingIcon: 'text-donator group-hover:text-donator',
      },
      onSelect() {
        toggle('donate')
      },
    },
  ],
])

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: routes.value.flat(),
  },
  {
    id: 'help',
    label: 'Links',
    items: [
      ...links.value.flat(),
      // About and Changelog live in the profile menu, not the sidebar
      { label: 'About', icon: 'hugeicons:badge-info', to: '/about' },
      { label: 'Changelog', icon: 'hugeicons:scroll-text', to: '/changelog' },
    ],
  },
  {
    id: 'palette',
    label: 'Palette',
    items: paletteItems.value,
  },
])

const visible = ref({
  feedback: false,
  donate: false,
})

const toggle = (key) => {
  visible.value[key] = !visible.value[key]
}

watch(collapsed, (isCollapsed, wasCollapsed) => {
  if (wasCollapsed && !isCollapsed) {
    routesMenuKey.value += 1
  }
})

// The banner across the top of every page: one announcement at a time, the
// next one taking its place once it is dismissed (keyed, so it remounts).
const banner = computed(() => announcements.bannerItem.value)
const bannerProps = computed(
  () =>
    banner.value &&
    announcementBanner(banner.value, () =>
      announcements.dismiss(banner.value.key),
    ),
)

// Announcement toasts on every page, once per page load (the layout stays
// mounted across navigation). Everything goes through one toast queue with
// the cookie consent last, so it stays on top and each toast is measured on
// its own (see useCookieConsent).
onMounted(async () => {
  await announcements.load()

  announcements.showToasts(toast)
  cookieConsent.show(toast)
})
</script>
