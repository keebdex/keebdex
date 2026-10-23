import type { NavigationMenuItem } from '@nuxt/ui'
import type { Ref } from 'vue'

type Domain = 'artisan' | 'keyboard' | 'keyset'

// The sidebar's catalog sections and its personal links (Notifications,
// Recent Changes). The layout adds the links that open its own modals.
export function useSidebarNavigation(collapsed: Ref<boolean>) {
  const route = useRoute()
  const { authenticated, isModerator } = storeToRefs(useUserStore())
  const { unread: unreadNotifications } = useNotifications()
  const { unread: unreadAnnouncements } = useAnnouncements()

  // Personal notifications plus announcements not read yet, so a new
  // announcement brings users to the Announcements tab.
  const unread = computed(
    () => unreadNotifications.value + unreadAnnouncements.value,
  )

  const isUnder = (path: string) => route.path.startsWith(path)

  // Each module lists its submissions to signed-in users last.
  const section = (
    domain: Domain,
    label: string,
    icon: string,
    children: NavigationMenuItem[],
  ): NavigationMenuItem[] => {
    if (authenticated.value) {
      children.push({
        label: 'Submissions',
        icon: 'hugeicons:file-verified',
        to: `/${domain}/submissions`,
        active: isUnder(`/${domain}/submissions`),
      })
    }

    if (collapsed.value) return children

    return [
      {
        label,
        icon,
        type: 'trigger',
        defaultOpen: true,
        active: isUnder(`/${domain}`),
        children,
      },
    ]
  }

  const routes = computed<NavigationMenuItem[][]>(() => [
    [
      {
        label: 'My Collection',
        icon: 'hugeicons:collections-bookmark',
        to: '/collection',
        active: isUnder('/collection'),
      },
    ],
    section('artisan', 'Artisans', 'hugeicons:alien-01', [
      {
        label: 'Makers',
        icon: 'hugeicons:user-multiple',
        to: '/artisan/maker',
        active: isUnder('/artisan/maker'),
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
    ]),
    section('keyboard', 'Keyboards', 'hugeicons:keyboard', [
      {
        label: 'Brands',
        icon: 'hugeicons:user-multiple',
        to: '/keyboard/brand',
        active: route.path === '/keyboard' || isUnder('/keyboard/brand'),
        exact: false,
      },
    ]),
    section('keyset', 'Keysets', 'hugeicons:grid-view', [
      {
        label: 'Profiles',
        icon: 'hugeicons:cross',
        to: '/keyset',
        exact: true,
        // Every keyset page except the other entries of the section.
        active:
          route.path === '/keyset' ||
          (isUnder('/keyset/') &&
            !['/keyset/group-buy', '/keyset/color'].includes(route.path) &&
            !isUnder('/keyset/submissions')),
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
    ]),
  ])

  const personalLinks = computed<NavigationMenuItem[]>(() => {
    const items: NavigationMenuItem[] = []

    // Signed-in users only; the dot icon and badge flag unread notifications
    // and announcements.
    if (authenticated.value) {
      items.push({
        label: 'Notifications',
        icon: unread.value ? 'hugeicons:bell-dot' : 'hugeicons:notification-01',
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
      })
    }

    // Staff only: revisions of the pages they manage.
    if (isModerator.value) {
      items.push({
        label: 'Recent Changes',
        icon: 'hugeicons:time-quarter-pass',
        to: '/recent-changes',
        active: route.path === '/recent-changes',
      })
    }

    return items
  })

  return { routes, personalLinks }
}
