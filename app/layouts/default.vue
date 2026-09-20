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

const { isAdmin, authenticated } = storeToRefs(userStore)

const open = ref(false)
const collapsed = ref(false)
const routesMenuKey = ref(0)
const { groupedProfiles } = useKeysetProfiles()

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

  let profiles = Object.entries(groupedProfiles.value)
    .map(([profile, profileManufacturers]) => {
      return [
        {
          label: profile,
          type: 'label',
        },
        ...Object.entries(profileManufacturers).map(([id, name]) => ({
          label: name,
          to: `/keyset/${id}`,
          exact: true,
          active: route.path.includes(`/keyset/${id}`),
        })),
      ]
    })
    .flat()

  if (isCollapsed) {
    profiles = profiles.filter((p) => p.type !== 'label')
  }

  const statuses = Object.entries(keysetStatusMap).map(([status, meta]) => ({
    label: meta.title,
    icon: meta.icon,
    to: `/keyset?status=${status}`,
    active: route.path === '/keyset' && route.query.status === status,
    exact: true,
  }))

  if (!isAdmin.value) {
    statuses.pop()
  }

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
      label: 'Colorway Submissions',
      icon: 'hugeicons:file-verified',
      to: '/artisan/colorway-submissions',
      active: route.path === '/artisan/colorway-submissions',
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

  const keysetChildren = [
    ...statuses,
    {
      label: 'Sets by Profile',
      icon: 'hugeicons:grid-view',
      ...(isCollapsed ? {} : { type: 'trigger' }),
      defaultOpen: false,
      active:
        route.path.startsWith('/keyset/') && !route.path.endsWith('color'),
      children: profiles,
    },
    {
      label: 'Color Swatches',
      icon: 'hugeicons:colors',
      to: '/keyset/color',
      active: route.path === '/keyset/color',
    },
  ]

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
      label: 'About',
      icon: 'hugeicons:badge-info',
      to: '/about',
      active: route.path === '/about',
    },
    {
      label: 'Updates',
      icon: 'hugeicons:megaphone-02',
      to: '/changelog',
      active: route.path === '/changelog',
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
    items: links.value.flat(),
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
  const cookieConsent = useCookie('cookie-consent')

  // Show cookie consent if not accepted
  if (cookieConsent.value !== 'accepted') {
    toast.add({
      title: 'We use cookies',
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
          ui: {
            label: 'block',
          },
        },
      ],
    })
  }

  const seenColorwaySubmissions = useCookie('seen-colorway-submissions')

  // Announce the new community colorway submission feature until acknowledged.
  if (seenColorwaySubmissions.value !== 'acknowledged') {
    toast.add({
      title: 'New: Community Colorway Submissions',
      description: 'Anyone can now submit artisan colorways for review.',
      icon: 'hugeicons:paint-board',
      color: 'primary',
      duration: 0,
      close: false,
      actions: [
        {
          label: 'Browse Makers',
          to: '/artisan/maker',
          onClick: () => acknowledge(seenColorwaySubmissions),
          ui: {
            label: 'block',
          },
        },
        {
          label: 'Dismiss',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => acknowledge(seenColorwaySubmissions),
          ui: {
            label: 'block',
          },
        },
      ],
    })
  }

  const seenCollectionGuide = useCookie('seen-collection-guide')

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
          ui: {
            label: 'block',
          },
        },
      ],
    })
  }
})
</script>
