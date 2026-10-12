<template>
  <UDashboardPanel id="about">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar title="About Keebdex" />
    </template>

    <template #body>
      <UPageSection
        headline="Collect smarter, share proudly"
        title="Your Collection Belongs Here"
        :description="description"
        icon="solar:palette-bold-duotone"
        :features="features"
        :links="[
          {
            label: 'Why choose Keebdex?',
            to: '/why-choose-keebdex',
            icon: 'solar:star-fall-bold-duotone',
            color: 'primary',
            ui: {
              label: 'block',
            },
          },
        ]"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
const description =
  'Learn how Keebdex empowers collectors with a purpose-built platform to organize, sync, and share the full keyboard trinity: keyboards, keysets, and artisans.'

const features = ref([
  {
    icon: 'solar:database-bold-duotone',
    title: 'Unified Trinity Database',
    description:
      'Keyboards, keysets, and artisans live together in one managed database, moving beyond the artisan-only Google Docs into detailed pages you can browse, search, and collect.',
  },
  {
    icon: 'solar:stars-bold-duotone',
    title: 'Beautiful, Intuitive Design',
    description:
      'A sleek, modern interface built for collectors, with theme presets, light or dark mode, and images sized for your screen so every page stays fast, even on phones.',
  },
  {
    icon: 'solar:devices-bold-duotone',
    title: 'Secure Login, Synced Everywhere',
    description:
      'Sign in instantly with your Google or Discord account. Your collections, theme, and color mode follow you, so everything looks the same on every device you use.',
  },
  {
    icon: 'solar:bookmark-square-bold-duotone',
    title: 'Powerful Collection Tools',
    description:
      'Create unlimited collections across keyboards, keysets, and artisans and save new finds from any page. Artisan collections can be a shelf of caps you own, a wishlist, or caps for sale or trade, with prices and a custom order.',
  },
  {
    icon: 'solar:magnifer-bold-duotone',
    title: 'Search Everything',
    description:
      'Find any keyboard, keyset, maker, sculpt, or colorway from one search box that updates as you type, with results grouped by category so you can jump straight to its page.',
  },
  {
    icon: 'solar:gallery-add-bold-duotone',
    title: 'Community Submissions',
    description:
      'Propose colorways, kits, and keyboard variants, or a whole new sculpt, keyset, or keyboard, through a guided step-by-step wizard, reviewed by moderators before going live.',
  },
  {
    icon: 'solar:share-circle-bold-duotone',
    title: 'Share Your Passion',
    description:
      'Share artisan collections by link, turn wishlists and colorway or keyboard cards into eye-catching images for any community, and meet buyers and sellers in the Trading Hub.',
  },
])

useSeoMeta({
  title: 'About',
  description,
})
</script>
