<template>
  <UBanner
    id="asking-price-banner"
    icon="hugeicons:hot-price"
    :actions="[
      {
        label: 'Start Managing',
        to: '/collection',
        trailingIcon: 'hugeicons:arrow-right-02',
      },
    ]"
    close
  >
    <template #title>
      You can now add asking prices to your selling items.
    </template>
  </UBanner>
</template>
