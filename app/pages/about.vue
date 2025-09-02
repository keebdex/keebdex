<template>
  <UDashboardPanel id="about">
    <template v-if="$device.isMobile" #header>
      <UDashboardNavbar title="About Keebdex" />
    </template>

    <template #body>
      <UPageSection
        headline="Built for collectors, designed for sharing"
        title="All-in-one Platform for Collectors"
        :description="description"
        icon="solar:palette-bold-duotone"
        :features="features"
        :links="[
          {
            label: 'Why choose Keebdex?',
            to: '/why-choose-keebdex',
            icon: 'solar:star-fall-bold-duotone',
            color: 'primary',
          },
        ]"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
const description =
  'Keebdex makes it easy to manage artisan keycaps, keycap sets, and keyboard gear — with tools for syncing, organizing, and trading.'

const features = ref([
  {
    icon: 'solar:database-bold-duotone',
    title: 'Fully Managed Artisan Database',
    description:
      'Say goodbye to the limitations of Google Docs. Our robust database ensures seamless organization and easy access to your keycap collection, with optional legacy sync for makers still using Docs.',
  },
  {
    icon: 'solar:stars-bold-duotone',
    title: 'Modern UI Design',
    description:
      'Immerse yourself in a sleek, intuitive interface built with the latest tech (Nuxt UI), prioritizing user experience.',
  },
  {
    icon: 'solar:login-2-bold-duotone',
    title: 'Effortless Access',
    description:
      'Log in with Google, Discord, or more — for quick, secure, and convenient access.',
  },
  {
    icon: 'solar:devices-bold-duotone',
    title: 'Cross-Device Sync',
    description:
      'Keep your data synchronized across devices so your collection is always at your fingertips.',
  },
  {
    icon: 'solar:bookmark-square-bold-duotone',
    title: 'Rich Collection Features',
    description:
      'Create unlimited collections, mark items as sold/done, move them between collections, and keep everything organized without limits.',
  },
  {
    icon: 'solar:share-circle-bold-duotone',
    title: 'Shareable Wishlists',
    description:
      'Generate stunning wishlist images to easily share your dream setups with the community.',
  },
  {
    icon: 'solar:cart-large-2-bold-duotone',
    title: 'Trading Hub',
    description:
      'Connect buyers and sellers directly through shared wishlists and dedicated tools designed for the artisan trading community.',
  },
])

useSeoMeta({
  title: 'About',
  description,
})
</script>
