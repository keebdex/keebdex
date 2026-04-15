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
      icon: 'solar:palette-bold-duotone',
      variant: 'subtle',
      color: 'primary',
      to: '/',
      ui: {
        label: 'block',
      },
    },
  },
  {
    id: 'keycaplendar',
    title: 'KeycapLendar',
    button: {
      label: 'Visit Alternative',
      icon: 'solar:calendar-bold-duotone',
      variant: 'soft',
      to: 'https://keycaplendar.firebaseapp.com/',
      target: '_blank',
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
      icon: 'solar:archive-down-minimlistic-bold-duotone',
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
    title: 'Scope & Purpose',
    features: [
      {
        title: 'Coverage & Focus',
        tiers: {
          keebdex:
            'Built for keyboards, keysets, and artisans, with detailed pages and collection tracking',
          keycaplendar:
            'Focused on keysets, especially where and when to buy them through vendor and timing visibility',
          archivist:
            'Focused on a simple web view of artisan data from Google Docs table-style listings',
        },
      },
      {
        title: 'Data Management',
        tiers: {
          keebdex:
            'Moves beyond artisan Google Docs into a fully managed database that now covers artisans, keyboards, and keysets',
          keycaplendar:
            'A Firebase-backed app that modernizes keyset tracking beyond a spreadsheet workflow',
          archivist:
            'Document-based, manually maintained across shared Google Docs',
        },
      },
    ],
  },
  {
    title: 'Experience & Maintenance',
    features: [
      {
        title: 'User Interface',
        tiers: {
          keebdex: 'Modern, responsive design optimized for collectors',
          keycaplendar:
            'A good simpler UI with lightweight drawer-based information',
          archivist: 'Static site with minimal interaction',
        },
      },
      {
        title: 'Image Support',
        tiers: {
          keebdex:
            'Rich, high-quality images to showcase keysets, artisans, and keyboard variants',
          keycaplendar:
            'Smaller preview images that keep the browsing layout compact',
          archivist: 'Limited preview images only',
        },
      },
      {
        title: 'Editing Access',
        tiers: {
          keebdex: 'Edit instantly through an intuitive web interface',
          keycaplendar:
            'Site content is actively curated by editors for keyset listings',
          archivist: 'Requires GitHub PRs with unpredictable approval times',
        },
      },
      {
        title: 'Public Codebase Activity',
        tiers: {
          keebdex: 'Actively evolving across the full collector workflow',
          keycaplendar:
            'Its public GitHub repository shows older visible commits, with the latest listed from 4 years ago',
          archivist:
            'Longtime without major feature updates, mainly relying on a daily cronjob to refresh the database',
        },
      },
    ],
  },
  {
    title: 'Accounts & Collector Tools',
    features: [
      {
        title: 'Login Methods',
        tiers: {
          keebdex: 'Google, Discord, and other options for flexibility',
          keycaplendar:
            'Google, GitHub, and Twitter authentication for account-based features',
          archivist: 'Discord login only',
        },
      },
      {
        title: 'Saved Preferences',
        tiers: {
          keebdex:
            'Collections and account tools help organize your setup across devices',
          keycaplendar:
            'Supports favourites, hidden sets, saved filter presets, and synced theme or density settings',
          archivist: 'Minimal personalization and syncing options',
        },
      },
      {
        title: 'Wishlist Sharing',
        tiers: {
          keebdex: 'Create and share beautiful wishlist images instantly',
          keycaplendar:
            'Favourites and hidden-set tools help triage sets, but not as a visual wishlist system',
          archivist: 'Static images generated server-side',
        },
      },
      {
        title: 'Trading Community',
        tiers: {
          keebdex:
            'Dedicated trading hub to connect buyers and sellers directly for artisans at the moment',
          keycaplendar: false,
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
