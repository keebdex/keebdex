<template>
  <UDashboardPanel :ui="{ root: 'flex-row' }">
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
