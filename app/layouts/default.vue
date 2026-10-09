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

    <div class="flex flex-col w-full">
      <slot />
    </div>

    <!-- <NotificationsSlideover /> -->

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
const userStore = useUserStore()

const { authenticated } = storeToRefs(userStore)

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

const links = computed(() => [
  [
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

const acknowledge = (cookie) => {
  cookie.value = 'acknowledged'
}

onMounted(() => {
  const persistentCookie = (name) =>
    useCookie(name, { maxAge: 60 * 60 * 24 * 365 })

  const cookieConsent = persistentCookie('cookie-consent')

  const persistentLocal = (name) => ({
    get value() {
      return localStorage.getItem(name)
    },
    set value(newValue) {
      localStorage.setItem(name, newValue)
    },
  })

  // Show cookie consent if not accepted
  if (cookieConsent.value !== 'accepted') {
    toast.add({
      title: 'We Use Cookies',
      description:
        'To improve your experience. By using our site, you agree to our use of cookies.',
      icon: 'hugeicons:cookie',
      duration: 0,
      close: false,
      actions: [
        {
          label: 'Accept',
          color: 'info',
          onClick: () => {
            cookieConsent.value = 'accepted'
          },
        },
      ],
    })
  }

  const seenCommunitySubmissions = persistentLocal('seen-community-submissions')

  // Announce community submissions (keyboards, keysets, artisan colorways) until acknowledged.
  if (seenCommunitySubmissions.value !== 'acknowledged') {
    toast.add({
      title: 'New: Community Submissions',
      description:
        'Anyone can now submit keyboards, keysets, and artisan colorways for review.',
      icon: 'hugeicons:file-verified',
      color: 'primary',
      close: false,
      actions: [
        {
          label: 'Dismiss',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => acknowledge(seenCommunitySubmissions),
        },
      ],
    })
  }

  const seenDiscordAnnouncement = persistentLocal('seen-discord-announcement')

  // Announce the new Keebdex Discord server for community chat, development, ideas, and feedback.
  if (seenDiscordAnnouncement.value !== 'acknowledged') {
    toast.add({
      title: 'New: Keebdex Discord',
      description:
        'Join the new Keebdex Discord server to chat, share ideas, and help shape future improvements.',
      icon: 'hugeicons:discord',
      color: 'info',
      close: false,
      actions: [
        {
          label: 'Join Discord',
          to: 'https://keebdex.org/discord',
          target: '_blank',
          trailingIcon: 'hugeicons:arrow-right-02',
          onClick: () => acknowledge(seenDiscordAnnouncement),
          ui: {
            label: 'block',
          },
        },
        {
          label: 'Dismiss',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => acknowledge(seenDiscordAnnouncement),
        },
      ],
    })
  }

  const seenCollectionGuide = persistentLocal('seen-collection-guide')

  // Point new users to the collection walkthrough video until acknowledged.
  if (seenCollectionGuide.value !== 'acknowledged') {
    toast.add({
      title: 'Manage Your Collection',
      description: 'Watch how to track your items and generate wishlists.',
      icon: 'hugeicons:collections-bookmark',
      color: 'info',
      duration: 0,
      close: false,
      actions: [
        {
          label: 'Watch',
          to: 'https://www.loom.com/share/660fe9bd026640788b2d0d8a6fe9b6b8',
          target: '_blank',
          trailingIcon: 'hugeicons:arrow-right-02',
          onClick: () => acknowledge(seenCollectionGuide),
          ui: {
            label: 'block',
          },
        },
        {
          label: 'Dismiss',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => acknowledge(seenCollectionGuide),
        },
      ],
    })
  }

  const seenThemeAnnouncement = persistentCookie('seen-theme-announcement')

  if (seenThemeAnnouncement.value !== 'acknowledged') {
    toast.add({
      title: 'Choose Your Theme',
      description: `Keebdex now supports multiple themes: Carbon, EVA-01, Parchment, Taro. Choose your favorite in Account Settings.`,
      icon: 'hugeicons:colors',
      color: 'primary',
      close: false,
      actions: [
        {
          label: 'Dismiss',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => acknowledge(seenThemeAnnouncement),
        },
      ],
    })
  }
})
</script>
