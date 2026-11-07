import type { NavigationMenuItem } from '@nuxt/ui'
import type { Ref } from 'vue'

// Links the sidebar leaves out, shared by the profile menu and the search
// palette. Plain constants, so the profile menu reads them without running
// this composable.
export const RECENT_CHANGES_LINK = {
  label: 'Recent Changes',
  icon: 'solar:clock-circle-line-duotone',
  to: '/recent-changes',
}

// The info pages, in the order of the keycap row that opens each of them
// (SharedInfoHero), with the short name the keycap shows
export const INFO_PAGES = [
  {
    label: 'About Keebdex',
    legend: 'About',
    icon: 'solar:info-square-line-duotone',
    to: '/about',
  },
  {
    label: 'Features',
    legend: 'Features',
    icon: 'solar:stars-line-duotone',
    to: '/features',
  },
  {
    label: 'Why Choose Keebdex?',
    legend: 'Why Us',
    icon: 'solar:medal-ribbon-star-line-duotone',
    to: '/why-choose-keebdex',
  },
  {
    label: 'Changelog',
    legend: 'Changelog',
    icon: 'solar:document-text-line-duotone',
    to: '/changelog',
  },
  {
    label: 'Shoutouts',
    legend: 'Shoutouts',
    icon: 'solar:chat-round-like-line-duotone',
    to: '/shoutouts',
  },
  {
    label: 'Privacy Policy',
    legend: 'Privacy',
    icon: 'solar:shield-user-line-duotone',
    to: '/privacy',
  },
]

export const ABOUT_LINKS = INFO_PAGES.filter(({ to }) =>
  ['/about', '/features', '/changelog'].includes(to),
)

// The sidebar's catalog sections and its footer links (Leaderboard,
// Notifications). The layout adds Feedback and Support, which open its own
// modals; staff tools and the About links live in the profile menu.
// Each section's icon while you are on one of its pages (bold-duotone)
const SECTION_ACTIVE_ICONS: Record<KeebModule, string> = {
  artisan: 'solar:ghost-smile-bold-duotone',
  keyboard: 'solar:keyboard-bold-duotone',
  keyset: 'solar:widget-bold-duotone',
}

export function useSidebarNavigation(collapsed: Ref<boolean>) {
  const route = useRoute()
  const { authenticated } = storeToRefs(useUserStore())
  const { unread: unreadNotifications } = useNotifications()
  const { unread: unreadAnnouncements } = useAnnouncements()
  const { total: pendingReviews } = usePendingReviews()

  // Personal notifications plus announcements not read yet, so a new
  // announcement brings users to the Announcements tab.
  const unread = computed(
    () => unreadNotifications.value + unreadAnnouncements.value,
  )

  const isUnder = (path: string) => route.path.startsWith(path)

  // Each module lists its submissions to signed-in users last, with what
  // waits for review there as a badge for staff.
  const section = (
    domain: KeebModule,
    label: string,
    children: NavigationMenuItem[],
  ): NavigationMenuItem[] => {
    if (authenticated.value) {
      children.push({
        label: 'Submissions',
        icon: 'solar:file-check-line-duotone',
        activeIcon: 'solar:file-check-bold-duotone',
        to: `/${domain}/submissions`,
        active: isUnder(`/${domain}/submissions`),
        badge: pendingBadge(pendingReviews(domain)),
      })
    }

    if (collapsed.value) return children

    return [
      {
        label,
        icon: KEEB_MODULE_ICONS[domain],
        activeIcon: SECTION_ACTIVE_ICONS[domain],
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
        icon: 'solar:bookmark-square-line-duotone',
        activeIcon: 'solar:bookmark-square-bold-duotone',
        to: '/collection',
        active: isUnder('/collection'),
      },
    ],
    section('artisan', 'Artisans', [
      {
        label: 'Makers',
        icon: 'solar:users-group-rounded-line-duotone',
        activeIcon: 'solar:users-group-rounded-bold-duotone',
        to: '/artisan/maker',
        active: isUnder('/artisan/maker'),
      },
      {
        label: 'Trading Hub',
        icon: 'solar:shop-line-duotone',
        activeIcon: 'solar:shop-bold-duotone',
        to: '/artisan/marketplace',
        active: route.path === '/artisan/marketplace',
      },
      {
        label: 'Wishlist Image',
        icon: 'solar:magic-stick-3-line-duotone',
        activeIcon: 'solar:magic-stick-3-bold-duotone',
        to: '/artisan/wishlist',
        active: route.path === '/artisan/wishlist',
      },
    ]),
    section('keyboard', 'Keyboards', [
      {
        label: 'Brands',
        icon: 'solar:users-group-rounded-line-duotone',
        activeIcon: 'solar:users-group-rounded-bold-duotone',
        to: '/keyboard/brand',
        active: route.path === '/keyboard' || isUnder('/keyboard/brand'),
        exact: false,
      },
    ]),
    section('keyset', 'Keysets', [
      {
        label: 'Profiles',
        icon: 'solar:add-square-line-duotone',
        activeIcon: 'solar:add-square-bold-duotone',
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
        icon: 'solar:play-stream-line-duotone',
        activeIcon: 'solar:play-stream-bold-duotone',
        to: '/keyset/group-buy',
        active: route.path === '/keyset/group-buy',
      },
      {
        label: 'Colors',
        icon: 'solar:palette-round-line-duotone',
        activeIcon: 'solar:palette-round-bold-duotone',
        to: '/keyset/color',
        active: route.path === '/keyset/color',
      },
    ]),
  ])

  const personalLinks = computed<NavigationMenuItem[]>(() => {
    const items: NavigationMenuItem[] = [
      {
        label: 'Leaderboard',
        icon: 'solar:cup-star-line-duotone',
        activeIcon: 'solar:cup-star-bold-duotone',
        to: '/leaderboard',
        active: route.path === '/leaderboard',
      },
    ]

    // Signed-in users only; the badge flags unread notifications
    // and announcements.
    if (authenticated.value) {
      items.push({
        label: 'Notifications',
        icon: 'solar:notification-unread-lines-line-duotone',
        activeIcon: 'solar:notification-unread-lines-bold-duotone',
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

    return items
  })

  return { routes, personalLinks }
}
