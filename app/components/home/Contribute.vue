<template>
  <UPageCTA
    title="Know something the dex doesn't?"
    description="Add a colorway, a keyset, or a keyboard. Reviewers check every submission, and each one approved counts toward the leaderboard."
    variant="subtle"
    :links="links"
    :ui="{ container: 'py-10 sm:py-14 lg:py-16', links: 'flex-wrap' }"
  />
</template>

<script setup>
// One link per submission wizard; guests sign in from there. A call to
// action, so its icons are the modules' bold-duotone ones
const link = { size: 'lg', ui: { label: 'block' } }
const links = [
  {
    ...link,
    label: 'Submit a Colorway',
    icon: 'solar:ghost-smile-bold-duotone',
    to: '/artisan/submissions/submit',
    color: 'primary',
    variant: 'solid',
  },
  {
    ...link,
    label: 'Submit a Keyboard',
    icon: 'solar:keyboard-bold-duotone',
    to: '/keyboard/submissions/submit',
    variant: 'outline',
  },
  {
    ...link,
    label: 'Submit a Keyset',
    icon: 'solar:widget-bold-duotone',
    to: '/keyset/submissions/submit',
    variant: 'outline',
  },
]
</script>
