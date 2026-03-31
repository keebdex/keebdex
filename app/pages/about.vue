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
  'Keebdex is the ultimate platform for keyboard collectors to curate, sync, and showcase their collections. Organize your artisans intelligently, stay synced across devices, and share your passion with fellow enthusiasts.'

const features = ref([
  {
    icon: 'solar:database-bold-duotone',
    title: 'Fully Managed Artisan Database',
    description:
      'Move beyond document-based systems. Our powerful database replaces shared Google Docs with a robust, purpose-built platform for your keycap collection, with optional sync for makers migrating from legacy tools.',
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
      'Create unlimited collections, track status (sold, completed, active), reorganize freely, and never hit a limit.',
  },
  {
    icon: 'solar:share-circle-bold-duotone',
    title: 'Share Your Passion',
    description:
      'Generate eye-catching wishlist images and share your dream builds with the community in seconds.',
  },
  {
    icon: 'solar:cart-large-2-bold-duotone',
    title: 'Built-In Trading Community',
    description:
      'Connect directly with buyers and sellers through wishlists and tools designed specifically for artisan enthusiasts.',
  },
])

useSeoMeta({
  title: 'About',
  description,
})
</script>
