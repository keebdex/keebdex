<template>
  <UDashboardPanel id="marketplace" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Marketplace" />
    </template>

    <template #body>
      <UAlert icon="hugeicons:information-circle" variant="soft" color="info">
        <template #description>
          To make your collections available in the marketplace, please publish
          them by visiting
          <NuxtLink to="/collection" class="underline">Collections</NuxtLink>.
          This will make them visible to potential buyers/sellers.
        </template>
      </UAlert>

      <MarketplaceListing />
    </template>
  </UDashboardPanel>
</template>

<script setup>
useSeoMeta({
  title: 'Marketplace',
  description: 'Unlock potential buyers/sellers for your artisan keycaps!',
})
</script>
