<template>
  <UPageCTA
    title="Keep Keebdex Thriving"
    description="Keebdex is built for enthusiasts, by enthusiasts — and your donation keeps it thriving."
    :links="[
      {
        label: 'Buy Me a Coffee',
        icon: 'simple-icons:buymeacoffee',
        block: true,
        to: 'https://www.buymeacoffee.com/anhthang',
        target: '_blank',
        class: 'hover:bg-[#FFDD00] hover:text-black',
      },
      {
        label: 'PayPal',
        icon: 'simple-icons:paypal',
        block: true,
        to: 'https://paypal.me/anhthangbui',
        target: '_blank',
        class: 'hover:bg-[#003087] hover:text-white',
      },
    ]"
  />
</template>
