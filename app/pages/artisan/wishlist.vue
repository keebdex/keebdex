<template>
  <UDashboardPanel v-if="$device.isMobile" id="wishlist-mobile">
    <template #header>
      <UDashboardNavbar title="Wishlist" />
    </template>
    <template #body>
      <UPageSection
        icon="hugeicons:computer"
        title="Desktop Only Feature"
        description="The Wishlist Builder is designed for desktop use. Please switch to a desktop device for the best experience."
        class="mx-auto"
      />
    </template>
  </UDashboardPanel>

  <UDashboardPanel v-else :ui="{ root: 'flex-row' }">
    <ArtisanWishlistPreview />

    <ArtisanWishlistSettings />
  </UDashboardPanel>
</template>

<script setup>
useSeoMeta({
  title: 'Wishlist',
  description:
    'Quickly generate visual wishlists for buying & selling. Share on Discord, social media, and more.',
})
</script>
