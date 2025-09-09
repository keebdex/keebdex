<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:visible="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
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
          <UDashboardSidebarCollapse />
        </div>
      </template>

      <template #default="{ collapsed }">
        <template v-if="collapsed">
          <UDashboardSearchButton :collapsed="collapsed" />
          <UDashboardSidebarCollapse />
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

      <template #footer="{ collapsed }">
        <ProfileMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

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

const { authenticated } = storeToRefs(userStore)

const open = ref(false)

const routes = computed(() => {
  const items = [
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
            to: '/artisan/marketplace',
            active: route.path === '/artisan/marketplace',
            exact: true,
          },
          {
            label: 'Wishlist Image',
            to: '/artisan/wishlist',
            active: route.path === '/artisan/wishlist',
            exact: true,
          },
        ],
      },
    ],
    [
      {
        label: 'Keycap Tracker',
        icon: 'hugeicons:calendar-03',
        to: '/keycap/tracker',
        active: route.path === '/keycap/tracker',
      },
      {
        label: 'Keycap Profile',
        icon: 'hugeicons:grid-view',
        defaultOpen: true,
        active:
          route.path.startsWith('/keycap') && !route.path.endsWith('tracker'),
        children: Object.entries(keycapProfiles)
          .map(([profile, manufacturers]) => {
            return [
              {
                label: profile,
                defaultOpen: false,
                type: 'trigger',
                active: Object.keys(manufacturers).includes(
                  route.path.substring(8),
                ),
                children: Object.entries(manufacturers).map(([id, name]) => {
                  return {
                    label: name,
                    to: `/keycap/${id}`,
                    exact: true,
                  }
                }),
              },
            ]
          })
          .flat(),
      },
    ],
  ]

  if (authenticated.value) {
    items.unshift([
      {
        label: 'My Collection',
        icon: 'hugeicons:collections-bookmark',
        to: '/collection',
        active: route.path.startsWith('/collection'),
      },
    ])
  }

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
      class: 'cursor-pointer',
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

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title:
      'We use cookies to improve your experience. By using our site, you agree to our use of cookies.',
    icon: 'hugeicons:cookie',
    duration: 0,
    close: false,
    actions: [
      {
        label: 'Accept',
        color: 'neutral',
        color: 'info',
        onClick: () => {
          cookie.value = 'accepted'
        },
      },
      {
        label: 'Decline',
        color: 'neutral',
        variant: 'ghost',
      },
    ],
  })
})
</script>
