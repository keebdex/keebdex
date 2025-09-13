<template>
  <UPageSection
    icon="solar:hand-heart-bold-duotone"
    title="Support Keebdex"
    description="Built for enthusiasts, by enthusiasts — your support fuels its future."
    :links="[
      {
        label: 'Buy Me a Coffee',
        icon: 'simple-icons:buymeacoffee',
        block: true,
        to: 'https://www.buymeacoffee.com/anhthang',
        target: '_blank',
        class: 'hover:bg-buymeacoffee hover:text-black',
      },
      {
        label: 'PayPal',
        icon: 'simple-icons:paypal',
        block: true,
        to: 'https://paypal.me/anhthangbui',
        target: '_blank',
        class: 'hover:bg-paypal hover:text-white',
      },
    ]"
    :ui="{
      leadingIcon: 'text-donator',
    }"
  />
</template>
