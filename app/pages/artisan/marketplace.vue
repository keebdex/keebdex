<template>
  <UDashboardPanel id="marketplace">
    <template #header>
      <UDashboardNavbar title="Trading Hub" />
    </template>

    <template #body>
      <UPage>
        <UAlert icon="hugeicons:information-circle" color="info">
          <template #description>
            To list your caps here, create a
            <span class="font-medium">Wishlist</span> or
            <span class="font-medium">For Sale or Trade</span> collection in
            <ULink to="/collection" class="underline">My Collection</ULink>,
            then choose <span class="font-medium">Create Public Link</span>
            under Share on its page.
          </template>
        </UAlert>

        <ArtisanMarketplaceListing class="mt-6" />
      </UPage>
    </template>
  </UDashboardPanel>
</template>

<script setup>
useSeoMeta({
  title: 'Trading Hub',
  description: 'Find buyers and sellers for artisan keycaps.',
})
</script>
