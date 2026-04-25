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
      <AppBanner />
      <slot />
    </div>

    <!-- <NotificationsSlideover /> -->

    <UModal v-model:open="visible.feedback" title="Share your thoughts!">
      <template #body>
        <ModalFeedbackForm />
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

const { isAdmin } = storeToRefs(userStore)

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
      icon: 'hugeicons:user-group-03',
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

  const keyboardChildren = [
    {
      label: 'Brands',
      icon: 'hugeicons:user-group-03',
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
      icon: 'hugeicons:comment-01',
      class: 'cursor-pointer',
      onSelect() {
        toggle('feedback')
      },
    },
    {
      label: 'About',
      icon: 'hugeicons:information-diamond',
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

onMounted(() => {
  const cookie = useCookie('cookie-consent')

  // Show cookie consent if not accepted
  if (cookie.value !== 'accepted') {
    toast.add({
      title:
        'We use cookies to improve your experience. By using our site, you agree to our use of cookies.',
      icon: 'hugeicons:cookie',
      duration: 0,
      close: false,
      actions: [
        {
          label: 'Accept',
          color: 'info',
          onClick: () => {
            cookie.value = 'accepted'
          },
          ui: {
            label: 'block',
          },
        },
      ],
    })
  }
})
</script>
