<template>
  <UDashboardPanel id="why-choose-keebdex">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar :title="title" />
    </template>

    <template #body>
      <UPageSection :title="title" :description="description">
        <UPageCard>
          <UPricingTable
            :tiers="tiers"
            :sections="sections"
            :ui="{
              tierTitleWrapper: 'justify-center',
            }"
          />
        </UPageCard>
      </UPageSection>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const tiers = ref([
  {
    id: 'keebdex',
    title: 'Keebdex',
    highlight: true,
    button: {
      label: 'Start Exploring',
      icon: 'solar:telescope-bold-duotone',
      variant: 'subtle',
      color: 'primary',
      to: '/',
      ui: {
        label: 'block',
      },
    },
  },
  {
    id: 'archivist',
    title: 'Keycap Archivist',
    button: {
      label: 'Visit Alternative',
      icon: 'solar:link-bold-duotone',
      variant: 'soft',
      to: 'https://keycap-archivist.com',
      target: '_blank',
      ui: {
        label: 'block',
      },
    },
  },
])

const sections = ref([
  {
    title: 'General',
    features: [
      {
        title: 'Collection Coverage',
        tiers: {
          keebdex:
            'Built for the keyboard trinity: keyboards, keysets, and artisans',
          archivist: 'Built specifically for artisan keycaps',
        },
      },
      {
        title: 'Data Management',
        tiers: {
          keebdex:
            'Moves beyond artisan Google Docs into a fully managed database that now covers artisans, keyboards, and keysets',
          archivist:
            'Document-based, manually maintained across shared Google Docs',
        },
      },
      {
        title: 'Editing Access',
        tiers: {
          keebdex: 'Edit instantly through an intuitive web interface',
          archivist: 'Requires GitHub PRs with unpredictable approval times',
        },
      },
      {
        title: 'User Interface',
        tiers: {
          keebdex: 'Modern, responsive design optimized for collectors',
          archivist: 'Static site with minimal interaction',
        },
      },
      {
        title: 'Image Support',
        tiers: {
          keebdex:
            'Rich, high-quality images to showcase keysets, artisans, and keyboard variants',
          archivist: 'Limited preview images only',
        },
      },
      {
        title: 'Collection Management',
        tiers: {
          keebdex:
            'Unlimited collections, instant sync across devices, organize and track status effortlessly',
          archivist: 'No sync or organization tools; view-only experience',
        },
      },
      {
        title: 'Login Methods',
        tiers: {
          keebdex: 'Google, Discord, and other options for flexibility',
          archivist: 'Discord login only',
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
          keebdex: 'Create and share beautiful wishlist images instantly',
          archivist: 'Static images generated server-side',
        },
      },
      {
        title: 'Trading Community',
        tiers: {
          keebdex:
            'Dedicated trading hub to connect buyers and sellers directly',
          archivist: false,
        },
      },
    ],
  },
])

const title = 'Why Choose Keebdex?'
const description =
  'A modern platform built for collectors. See how Keebdex outpaces alternatives with better data management, intuitive editing, and powerful tools designed for the full keyboard trinity: keyboards, keysets, and artisans.'

useSeoMeta({
  title,
  description,
})
</script>
