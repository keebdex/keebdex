<template>
  <UDashboardPanel id="about">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar title="About Keebdex" />
    </template>

    <template #body>
      <SharedInfoHero title="Your Collection Belongs Here" :description>
        <UButton
          :label="authenticated ? 'My Collection' : 'Start Collecting'"
          to="/collection"
          icon="hugeicons:collections-bookmark"
          color="primary"
          size="lg"
          :ui="{ label: 'block' }"
        />
        <UButton
          label="Compare With Other Sites"
          to="/why-choose-keebdex"
          variant="link"
          size="lg"
          trailing-icon="hugeicons:arrow-right-02"
          :ui="{ label: 'block' }"
        />
      </SharedInfoHero>

      <!-- What collectors do here, one group per row: the group on the left,
      what Keebdex gives them for it on the right -->
      <div class="pb-10">
        <section
          v-for="group in groups"
          :key="group.title"
          :aria-labelledby="`about-${group.id}`"
          class="grid gap-6 border-t border-default py-10 sm:py-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 xl:gap-16"
        >
          <div>
            <h2
              :id="`about-${group.id}`"
              class="text-2xl font-semibold text-balance text-highlighted"
            >
              {{ group.title }}
            </h2>
            <p class="mt-2 max-w-md text-pretty text-muted">
              {{ group.description }}
            </p>
          </div>

          <ul class="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <li v-for="feature in group.features" :key="feature.title">
              <UIcon :name="feature.icon" class="size-6 text-primary" />
              <h3 class="mt-3 font-semibold text-highlighted">
                {{ feature.title }}
              </h3>
              <p class="mt-1.5 max-w-prose text-pretty text-muted">
                {{ feature.description }}
              </p>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const { authenticated } = storeToRefs(useUserStore())

const description =
  'Keebdex is a catalog of artisan keycaps, keysets, and keyboards, made for the collectors who hunt, keep, and trade them.'

const groups = [
  {
    id: 'find',
    title: 'Find Anything',
    description:
      'The whole keyboard trinity in one place, instead of a spreadsheet for each.',
    features: [
      {
        icon: 'hugeicons:database-01',
        title: 'One Catalog for the Trinity',
        description:
          'Keyboards, keysets, and artisans live together in one managed database, moving beyond the artisan-only Google Docs into detailed pages you can browse, search, and collect.',
      },
      {
        icon: 'hugeicons:search-01',
        title: 'Search Everything',
        description:
          'Find any keyboard, keyset, maker, sculpt, or colorway from one search box that updates as you type, with results grouped by category so you can jump straight to its page.',
      },
    ],
  },
  {
    id: 'collect',
    title: 'Track What You Own',
    description:
      'Keep a record of every cap, set, and board, and of the ones you are still chasing.',
    features: [
      {
        icon: 'hugeicons:collections-bookmark',
        title: 'Collections for Everything',
        description:
          'Create unlimited collections across keyboards, keysets, and artisans and save new finds from any page. Artisan collections can be a shelf of caps you own, a wishlist, or caps for sale or trade, with prices and a custom order.',
      },
      {
        icon: 'hugeicons:user-account',
        title: 'Synced Everywhere',
        description:
          'Sign in with your Google or Discord account. Your collections, theme, and color mode follow you, so everything looks the same on every device you use.',
      },
    ],
  },
  {
    id: 'share',
    title: 'Share and Trade',
    description:
      'Show your collection off, and find the people who have the cap you want.',
    features: [
      {
        icon: 'hugeicons:share-08',
        title: 'Made to Be Shared',
        description:
          'Share artisan collections by link, and turn wishlists and colorway or keyboard cards into images ready for Discord, Reddit, or any community.',
      },
      {
        icon: 'hugeicons:store-01',
        title: 'Trading Hub',
        description:
          'Make a wishlist or a for-sale collection public and it is listed in the Trading Hub, where buyers and sellers find each other and reach out on Discord.',
      },
    ],
  },
  {
    id: 'contribute',
    title: 'Build It Together',
    description:
      'The catalog grows with its collectors, and every approved contribution earns points on the leaderboard.',
    features: [
      {
        icon: 'hugeicons:add-circle',
        title: 'Community Submissions',
        description:
          'Propose colorways, kits, and keyboard variants, or a whole new sculpt, keyset, or keyboard, through a guided step-by-step wizard, reviewed by moderators before going live.',
      },
      {
        icon: 'hugeicons:edit-02',
        title: 'Suggest an Edit',
        description:
          'Spot a wrong date or a missing photo? Suggest a fix from the page itself, and a moderator reviews it before it changes.',
      },
    ],
  },
  {
    id: 'yours',
    title: 'Make It Yours',
    description: 'A catalog you will want to open every day, on any screen.',
    features: [
      {
        icon: 'hugeicons:paint-board',
        title: 'Themes Inspired by Keysets',
        description:
          'Pick from a growing set of theme presets, each with its own colors, fonts, and component style, in light, dark, or system mode. Your choice is saved to your account.',
      },
      {
        icon: 'hugeicons:smart-phone-01',
        title: 'Fast on Every Screen',
        description:
          'Clear layouts that work from phones to wide monitors, with images sized for your device so every page stays fast, even on a phone.',
      },
    ],
  },
]

useSeoMeta({
  title: 'About',
  description,
})
</script>
