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
        <NuxtLink to="/" class="flex items-end gap-2">
          <NuxtImg
            :alt="$config.app.name"
            :src="
              $colorMode.value === 'dark'
                ? '/logo-outlined.png'
                : '/logo-filled.png'
            "
            class="h-8 w-auto shrink-0"
          />

          <span
            v-if="!collapsed"
            class="text-xl font-bold bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
          >
            {{ $config.app.name }}
          </span>
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

        <WhatsNewSlider :collapsed="collapsed" />

        <UNavigationMenu
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

    <slot />

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

const routes = computed(() => {
  let profiles = Object.entries(keycapProfiles)
    .map(([profile, manufacturers]) => {
      return [
        {
          label: profile,
          type: 'label',
        },
        ...Object.entries(manufacturers).map(([id, name]) => {
          return {
            label: name,
            to: `/keycap/${id}`,
            exact: true,
            active: route.path.includes(`/keycap/${id}`),
          }
        }),
      ]
    })
    .flat()

  if (collapsed.value) {
    profiles = profiles.filter((p) => p.type !== 'label')
  }

  const statuses = Object.entries(keycapStatusMap).map(([status, meta]) => {
    return {
      label: meta.title,
      icon: meta.icon,
      to: `/keycap?status=${status}`,
      active: route.path === '/keycap' && route.query.status === status,
      exact: true,
    }
  })

  if (!isAdmin.value) {
    statuses.pop()
  }

  const items = [
    [
      {
        label: 'My Collection',
        icon: 'hugeicons:collections-bookmark',
        to: '/collection',
        active: route.path.startsWith('/collection'),
      },
    ],
    [
      {
        label: 'Makers',
        icon: 'hugeicons:user-group-03',
        to: '/artisan/maker',
        active: route.path.startsWith('/artisan/maker'),
      },
      {
        label: 'Marketplace',
        icon: 'hugeicons:store-01',
        defaultOpen: true,
        type: 'trigger',
        active:
          route.path === '/artisan/marketplace' ||
          route.path === '/artisan/wishlist',
        children: [
          {
            label: 'Trading Hub',
            icon: 'hugeicons:store-01',
            to: '/artisan/marketplace',
            active: route.path === '/artisan/marketplace',
            exact: true,
          },
          {
            label: 'Wishlist Image',
            icon: 'hugeicons:ai-image',
            to: '/artisan/wishlist',
            active: route.path === '/artisan/wishlist',
            exact: true,
          },
        ],
      },
    ],
    [
      {
        label: 'Sets by Status',
        icon: 'hugeicons:calendar-03',
        defaultOpen: true,
        active: route.path === '/keycap',
        children: statuses,
      },
      {
        label: 'Sets by Profile',
        icon: 'hugeicons:grid-view',
        defaultOpen: false,
        active:
          route.path.startsWith('/keycap/') && !route.path.endsWith('color'),
        children: profiles,
      },
      {
        label: 'Color Swatches',
        icon: 'hugeicons:colors',
        to: '/keycap/color',
        active: route.path === '/keycap/color',
      },
    ],
  ]

  return items
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
      badge: {
        label: 'New',
        variant: 'subtle',
        color: 'primary',
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
        },
      ],
    })
  }
})
</script>
