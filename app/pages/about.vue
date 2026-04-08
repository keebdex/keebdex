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
      'Move beyond document-based systems. Google Docs handled artisan data only; Keebdex now manages keyboards, keysets, and artisans in one platform, with optional maker sync from legacy tools.',
  },
  {
    icon: 'solar:stars-bold-duotone',
    title: 'Beautiful, Intuitive Design',
    description:
      'Experience a sleek, modern interface built with cutting-edge technology. Every interaction is thoughtfully designed for collectors.',
  },
  {
    icon: 'solar:login-2-bold-duotone',
    title: 'Quick, Secure Login',
    description:
      'Sign in instantly with Google, Discord, or your preferred method. Your data is always protected.',
  },
  {
    icon: 'solar:devices-bold-duotone',
    title: 'Seamless Cross-Device Sync',
    description:
      'Access your collection anywhere. Changes sync instantly across all your devices.',
  },
  {
    icon: 'solar:bookmark-square-bold-duotone',
    title: 'Powerful Collection Tools',
    description:
      'Create unlimited collections across keyboards, keysets, and artisans; track status (sold, completed, active), reorganize freely, and never hit a limit.',
  },
  {
    icon: 'solar:share-circle-bold-duotone',
    title: 'Share Your Passion',
    description:
      'Generate eye-catching wishlist images and share your dream keyboard setups and collection targets with the community in seconds.',
  },
  {
    icon: 'solar:cart-large-2-bold-duotone',
    title: 'Built-In Trading Community',
    description:
      'Connect directly with buyers and sellers through wishlists and tools built for the full keyboard community, from artisans to keysets and boards.',
  },
])

useSeoMeta({
  title: 'About',
  description,
})
</script>
