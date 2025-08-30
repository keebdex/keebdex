<template>
  <UDashboardPanel id="marketplace">
    <template #header>
      <UDashboardNavbar title="Marketplace" />
    </template>

    <template #body>
      <UPage>
        <UAlert icon="hugeicons:information-circle" variant="soft" color="info">
          <template #description>
            To make your collections available in the marketplace, please
            publish them by visiting
            <ULink to="/collection" class="underline">Collections</ULink>. This
            will make them visible to potential buyers/sellers.
          </template>
        </UAlert>
      </UPage>

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
