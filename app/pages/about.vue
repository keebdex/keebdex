<template>
  <UDashboardPanel id="about">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar :title />
    </template>

    <template #body>
      <SharedInfoHero :title :description>
        <UButton
          label="Explore the Features"
          to="/features"
          icon="solar:stars-line-duotone"
          color="primary"
          size="lg"
          :ui="{ label: 'block' }"
        />
        <UButton
          label="View on GitHub"
          :to="REPOSITORY_URL"
          target="_blank"
          variant="link"
          size="lg"
          trailing-icon="solar:arrow-right-up-linear"
          :ui="{ label: 'block' }"
        />
      </SharedInfoHero>

      <!-- How Keebdex got here, release by release -->
      <UPageSection
        title="Our Story"
        :description="story"
        orientation="horizontal"
        :ui="sectionUi"
      >
        <UTimeline
          :items="milestones"
          :default-value="milestones.length - 1"
          class="mx-auto w-full max-w-md"
        />
      </UPageSection>

      <UPageSection
        title="How It Works"
        description="A catalog kept by the people who use it, free for everyone."
        :features="principles"
        :ui="sectionUi"
      />

      <!-- shrink-0: the panel body is a flex column, and the CTA's
      overflow-hidden would otherwise let it collapse to its ring -->
      <UPageCTA
        title="Made by Nya"
        :description="maker"
        :links="contactLinks"
        variant="subtle"
        class="mb-12 shrink-0"
      />

      <UModal v-model:open="donating">
        <template #content>
          <ModalDonate />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const CONTACT_EMAIL = 'contact@keebdex.org'
const REPOSITORY_URL = 'https://github.com/keebdex/keebdex'

const title = 'About Keebdex'
const description =
  'How Keebdex began, how its catalog is kept, and who makes it.'

// The sections fill the panel, which sets the width and gutters, and the
// titles step down from the hero's size, as on /features
const sectionUi = {
  container: `${panelContainerClass} sm:py-10 lg:py-12 gap-8 sm:gap-10 lg:gap-12`,
  title: 'text-2xl sm:text-3xl lg:text-3xl',
}

const story =
  'Keebdex started in 2021 as Keebtalogue, a home for artisan keycaps while their catalog still lived in shared Google Docs. It has grown with its collectors since, one release at a time, into a catalog of the whole keyboard trinity.'

// The releases that changed what Keebdex is (content/changelog)
const milestones = [
  {
    date: '2021',
    title: 'Keebtalogue Begins',
    description:
      'Collections and wishlists for artisan keycaps, built from makers, sculpts, and colorways.',
    icon: 'solar:flag-bold-duotone',
  },
  {
    date: 'December 2024',
    title: 'A Second Wind',
    description:
      'A redesigned site with link previews for every page, pins, search, and themes.',
    icon: 'solar:refresh-bold-duotone',
  },
  {
    date: 'September 2025',
    title: 'Keebtalogue Becomes Keebdex',
    description:
      'A new name, every page made for phones, and keysets with their colors.',
    icon: 'solar:tag-bold-duotone',
  },
  {
    date: 'April 2026',
    title: 'Keyboards Join',
    description:
      'Brands, keyboards, releases, and variants complete the trinity, in your collections too.',
    icon: 'solar:keyboard-bold-duotone',
  },
  {
    date: 'October 2026',
    title: 'Open to Everyone',
    description:
      'Any signed-in collector can add to the catalog, with moderators reviewing every change.',
    icon: 'solar:users-group-rounded-bold-duotone',
  },
]

const principles = [
  {
    icon: 'solar:users-group-two-rounded-bold-duotone',
    title: 'Built by Collectors',
    description:
      'New colorways, kits, keyboards, and fixes come from collectors through submissions and edit suggestions, and every approved one earns points on the leaderboard.',
  },
  {
    icon: 'solar:shield-check-bold-duotone',
    title: 'Reviewed Before It Goes Live',
    description:
      'Moderators, including makers and editors looking after their own pages, review each change, and every page keeps a history of what changed.',
  },
  {
    icon: 'solar:hand-heart-bold-duotone',
    title: 'Free, With No Ads',
    description:
      'Keebdex is free to use, with no ads and no third-party analytics. Its hosting is paid for by collectors who chip in.',
  },
  {
    icon: 'solar:code-square-bold-duotone',
    title: 'Open Source',
    description:
      'The code is on GitHub under the MIT license, so anyone can see how it works, report a problem, or send a fix.',
  },
]

const maker =
  'Keebdex is designed, built, and run by a fellow enthusiast, with moderators who look after the catalog and collectors who keep adding to it. A question, an idea, or a cap we are missing? Get in touch.'

const donating = ref(false)

const contactLinks = [
  {
    label: CONTACT_EMAIL,
    to: `mailto:${CONTACT_EMAIL}`,
    icon: 'solar:letter-bold-duotone',
    color: 'primary',
    ui: { label: 'block' },
  },
  {
    label: 'Support Keebdex',
    icon: 'solar:hand-heart-bold-duotone',
    variant: 'outline',
    ui: { label: 'block' },
    onClick: () => (donating.value = true),
  },
]

// Named like the menu link, so it skips the " - Keebdex" suffix
useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
})
</script>
