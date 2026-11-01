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
// One link per submission wizard; guests sign in from there
const labels = {
  artisan: 'Submit a Colorway',
  keyboard: 'Submit a Keyboard',
  keyset: 'Submit a Keyset',
}

const links = KEEB_MODULES.map((module, index) => ({
  label: labels[module],
  icon: KEEB_MODULE_ICONS[module],
  to: `/${module}/submissions/submit`,
  color: index ? 'neutral' : 'primary',
  variant: index ? 'outline' : 'solid',
  size: 'lg',
  ui: { label: 'block' },
}))
</script>
