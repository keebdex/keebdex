<template>
  <UDashboardPanel id="keebdex-vs-archivist">
    <template #header>
      <UDashboardNavbar title="Why choose Keebdex" />
    </template>

    <template #body>
      <UPageCard
        class="max-w-7xl mx-auto"
        title="Why choose Keebdex"
        description="Whether you're a seasoned collector or just starting out, Keebdex offers the best tools for organizing, syncing, and sharing your artisan keycap collection."
      >
        <UPricingTable :tiers="tiers" :sections="sections" />
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const tiers = ref([
  {
    id: 'keebdex',
    title: 'Keebdex',
    highlight: true,
  },
  {
    id: 'archivist',
    title: 'Keycap Archivist',
  },
])

const sections = ref([
  {
    title: 'General',
    features: [
      {
        title: 'Data Management',
        tiers: {
          keebdex:
            'Fully managed database with optional Google Docs sync for legacy makers',
          archivist: 'Relies entirely on manually maintained Google Docs',
        },
      },
      {
        title: 'Editing Access',
        tiers: {
          keebdex: 'Full editing capabilities via web interface',
          archivist:
            'Requires submitting GitHub PR or editing files, with slow or no merge activity',
        },
      },
      {
        title: 'User Interface',
        tiers: {
          keebdex: 'Sleek, modern UI built with Nuxt UI',
          archivist: 'Simple static site built with Gatsby',
        },
      },
      {
        title: 'Image Quantity',
        tiers: {
          keebdex: 'Supports larger and more comprehensive image sets per item',
          archivist: 'Basic image previews only',
        },
      },
      {
        title: 'Rich Collection Features',
        tiers: {
          keebdex:
            'Unlimited collections, cross-device sync, and advanced tools to manage and organize items',
          archivist:
            'No sync; lacks tools for organizing or updating item status',
        },
      },
      {
        title: 'Login Options',
        tiers: {
          keebdex: 'Supports Google, Discord, and more',
          archivist: 'Supports Discord login only',
        },
      },
    ],
  },
  {
    title: 'Wishlist & Trading',
    features: [
      {
        title: 'Wishlist Sharing',
        tiers: {
          keebdex:
            'Web-based interface with sharable wishlist images and pre-filled text',
          archivist:
            'Static wishlist image generated server-side (mobile-friendly)',
        },
      },
      {
        title: 'Trading Features',
        tiers: {
          keebdex:
            'Built-in Trading Hub to help buyers and sellers connect via shared wishlists',
          archivist: false,
        },
      },
    ],
  },
])

useSeoMeta({
  title: 'Why choose Keebdex',
  description:
    'Explore what makes Keebdex the better choice for keycap collectors.',
})
</script>
