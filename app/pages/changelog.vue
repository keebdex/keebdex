<template>
  <UDashboardPanel id="changelog">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar title="Changelog" />
    </template>

    <template #body>
      <UPageSection
        title="Changelog"
        :description
        icon="solar:history-bold-duotone"
      >
        <UChangelogVersions :versions="versions" :indicator="false">
          <template #description="{ version }">
            {{ version.description }}

            <ul v-if="Array.isArray(version.highlights)" class="list-disc mt-4">
              <li
                v-for="(detail, idx) in version.highlights"
                :key="idx"
                class="text-muted ml-8 lg:ml-12"
              >
                {{ detail }}
              </li>
            </ul>
          </template>
        </UChangelogVersions>
      </UPageSection>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const config = useRuntimeConfig()

const description =
  'Updates, improvements, and fixes to Keebdex. We ship continuously — here are the highlights.'

const badgeProps = {
  color: 'primary',
  variant: 'soft',
}

const authors = [
  {
    name: 'Anh Thang',
    description: '@anhthang',
    avatar: {
      src: 'https://github.com/anhthang.png',
    },
    to: 'https://github.com/anhthang',
    target: '_blank',
  },
]

const versions = [
  {
    badge: {
      label: config.app.buildId,
      ...badgeProps,
      color: 'info',
    },
    title: 'Nuxt Era',
    date: '2025-09-02',
    description:
      'A complete overhaul of the UI and core architecture, built on Nuxt 4 and Nuxt UI 4 for a faster, more modern, and fully responsive experience.',
    authors,
    highlights: [
      'Complete UI migration to Nuxt UI 4 for a modern, cohesive experience',
      'Upgraded to Nuxt 4, delivering significant performance improvements and faster load times',
      'Fully responsive design for a seamless experience on desktop, tablet, and mobile',
      'Added a "Priority" button to collections and wishlists to highlight key items',
      'Introduced new "Why Choose Keebdex" and "Changelog" pages',
      'Major codebase refactor for improved stability and future development',
    ],
    to: 'https://github.com/keebdex/keebdex/releases/tag/3.0.0',
  },
  {
    badge: {
      label: 'v2.1.0',
      ...badgeProps,
    },
    title: "The Collector's Edge",
    date: '2025-01-08',
    description:
      'Enhancements to collection management and wishlist generation with improved precision and style.',
    authors,
    highlights: [
      "Mark items as 'Found' or 'Sold' and visualize status within wishlist images",
      'Manage keycaps alongside other collectibles in a unified interface',
      'Refined wishlist generation for a tailored experience',
      'Login required for secure collection management',
      'Cleaned outdated artisan data with clearer user guidance',
      'Correct role-based editability for editors and makers',
      'Bug fixes for smoother experience',
    ],
    to: 'https://github.com/keebdex/keebdex/releases/tag/2.1.0',
  },
  {
    badge: {
      label: 'v2.0.0',
      ...badgeProps,
    },
    title: 'A New Era',
    date: '2024-12-07',
    description:
      'A major overhaul with PrimeVue migration, dynamic OG images, new features, and UI improvements.',
    authors,
    highlights: [
      'Migrated from Ant Design Vue to PrimeVue',
      'Dynamic OG images for projects',
      'Pin favorite makers & sculpts',
      'Keycap Tracker Page with running & upcoming projects',
      'Experimental global search',
      'Left sidebar navigation & breadcrumbs',
      'Maker nationality dropdown',
      'Improved colorway popup and keycap listings',
      'Marketplace UI enhancements',
      'Bug fixes for pagination, collections sync, and mobile UI',
      'Migrated to Nuxt 3 for performance & scalability',
      'SEO & Open Graph improvements',
      'New feedback form for user suggestions',
    ],
    to: 'https://github.com/keebdex/keebdex/releases/tag/2.0.0',
  },
  {
    badge: {
      label: 'v1.0.0',
      ...badgeProps,
    },
    title: 'The Beginning',
    date: '2024-10-19',
    description:
      'Inaugural release introducing Keebtalogue with maker, sculpt, sales, and colorway support.',
    authors,
    highlights: [
      'Homepage shows recently added information',
      'Maker page to add/edit/display makers',
      'Sculpt page with sculpt stories',
      'Upcoming sales with calendar view',
      'Discord login via Supabase Auth',
      'Archived makers tab',
      'Detailed colorway information',
      'Supabase integration replacing Firebase',
      'Dark/light mode UI and logos',
      'SEO with SSR metatags',
    ],
    to: 'https://github.com/keebdex/keebdex/releases/tag/1.0.0',
  },
]

useSeoMeta({
  title: 'Changelog',
  description,
})
</script>
