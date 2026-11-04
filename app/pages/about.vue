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

      <!-- What collectors do here, one section per group, zigzagging: the
      group's text on one side, a piece of the real app on the other -->
      <UPageSection
        v-for="(group, index) in groups"
        :key="group.id"
        :title="group.title"
        :description="group.description"
        :features="group.features"
        orientation="horizontal"
        :reverse="index % 2 === 1"
        :ui="sectionUi"
      >
        <!-- The newest colorways as a wall of keycaps, as on the home page,
        sized so each photo matches the binder page's below -->
        <HomeKeycapMosaic
          v-if="group.id === 'find' && showcase.length >= 8"
          :items="showcase"
          class="mx-auto w-full max-w-[34.25rem]"
        />

        <!-- A binder page of caps, like a collection's -->
        <UPageCard
          v-else-if="group.id === 'collect' && showcase.length >= 9"
          variant="subtle"
          aria-hidden="true"
          class="mx-auto w-full max-w-xs"
        >
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="colorway in showcase.slice(0, 9)"
              :key="colorway.colorway_id"
              class="aspect-square overflow-hidden rounded-md bg-elevated"
            >
              <NuxtImg
                :src="colorway.img"
                alt=""
                sizes="160px"
                loading="lazy"
                decoding="async"
                class="size-full object-cover"
              />
            </div>
          </div>
        </UPageCard>

        <!-- Two share cards fanned out, as they are copied for Discord -->
        <div
          v-else-if="group.id === 'share' && showcase.length >= 2"
          aria-hidden="true"
          class="relative mx-auto grid w-full max-w-xs justify-items-center py-4 [--card-width:min(13rem,60vw)]"
        >
          <ArtisanColorwayShareCard
            :colorway="shareCards[1]"
            simple
            class="col-start-1 row-start-1 -translate-x-8 -rotate-6 shadow-lg"
          />
          <ArtisanColorwayShareCard
            :colorway="shareCards[0]"
            simple
            class="col-start-1 row-start-1 translate-x-8 rotate-3 shadow-lg"
          />
        </div>

        <!-- The submission wizard's steps -->
        <UPageCard
          v-else-if="group.id === 'contribute'"
          variant="subtle"
          class="mx-auto w-full max-w-xs"
        >
          <UStepper
            :items="wizardSteps"
            orientation="vertical"
            :default-value="wizardSteps.length - 1"
            disabled
            :ui="{ trigger: 'size-8' }"
          />
        </UPageCard>

        <!-- Every theme, as a swatch of its own colors -->
        <ul
          v-else-if="group.id === 'yours'"
          class="mx-auto grid w-full max-w-sm grid-cols-2 gap-2"
        >
          <li
            v-for="preset in swatches"
            :key="preset.id"
            :style="preset.style"
            class="flex items-center gap-3 rounded-lg border border-default p-3"
          >
            <!-- The preset's background and primary color, in each mode
            through classes, since SSR cannot know a system color mode -->
            <span
              class="grid size-8 shrink-0 grid-cols-2 overflow-hidden rounded-md ring ring-[var(--swatch-border-light)] dark:ring-[var(--swatch-border-dark)]"
            >
              <span
                class="bg-[var(--swatch-bg-light)] dark:bg-[var(--swatch-bg-dark)]"
              />
              <span
                class="bg-[var(--swatch-primary-light)] dark:bg-[var(--swatch-primary-dark)]"
              />
            </span>
            <span class="min-w-0 truncate text-sm font-medium text-highlighted">
              {{ preset.label }}
            </span>
          </li>
        </ul>
      </UPageSection>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { resolvePresetToken } from '~/utils/theme-presets'

const { authenticated } = storeToRefs(useUserStore())

const description =
  'Keebdex is a catalog of artisan keycaps, keysets, and keyboards, made for the collectors who hunt, keep, and trade them.'

// The sections fill the panel, which sets the width and gutters, and the
// titles step down from the hero's size
const sectionUi = {
  container:
    'max-w-none px-0 sm:px-0 lg:px-0 sm:py-10 lg:py-12 gap-8 sm:gap-10 lg:gap-12',
  title: 'text-2xl sm:text-3xl lg:text-3xl',
}

// The live colorways the home page shows (GET /api/statistics, shared)
const { data: statistics } = await useHomeStatistics()
const showcase = computed(() => statistics.value.showcase)

// The share card shows its photo as stored, so the two decorative ones
// get a resized copy instead of the original
const img = useImage()
const shareCards = computed(() =>
  showcase.value
    .slice(0, 2)
    .map((colorway) => ({ ...colorway, img: img(colorway.img, { width: 400 }) })),
)

const wizardSteps = [
  {
    title: 'Maker',
    description: 'Pick the maker, or propose a new one.',
    icon: 'hugeicons:user-multiple',
  },
  {
    title: 'Sculpt',
    description: 'Choose the sculpt, or add it with its photos.',
    icon: 'hugeicons:dashboard-square-02',
  },
  {
    title: 'Colorway',
    description: 'Add the colorways, then send them for review.',
    icon: 'hugeicons:paint-board',
  },
]

// Each preset's own background, primary, and border colors in both modes,
// so the swatches look like the themes they apply (worked out once)
const { presets } = useAppTheme()
const swatches = presets.map((preset) => ({
  id: preset.id,
  label: preset.label,
  style: Object.fromEntries(
    ['light', 'dark'].flatMap((mode) =>
      [
        ['bg', '--ui-bg'],
        ['primary', '--ui-primary'],
        ['border', '--ui-border'],
      ].map(([name, token]) => [
        `--swatch-${name}-${mode}`,
        resolvePresetToken(preset, mode, token),
      ]),
    ),
  ),
}))

const groups = [
  {
    id: 'find',
    title: 'Find Anything',
    description:
      'The whole keyboard trinity in one place, instead of a spreadsheet for each.',
    features: [
      {
        icon: 'solar:database-bold-duotone',
        title: 'One Catalog for the Trinity',
        description:
          'Keyboards, keysets, and artisans live together in one managed database, moving beyond the artisan-only Google Docs into detailed pages you can browse, search, and collect.',
      },
      {
        icon: 'solar:magnifer-bold-duotone',
        title: 'Search Everything',
        description:
          'Find any keyboard, keyset, maker, sculpt, or colorway from one search box that updates as you type, with results grouped by category so you can jump straight to its page.',
      },
      {
        icon: 'solar:pallete-2-bold-duotone',
        title: 'Every Keycap Color',
        description:
          'Browse every keycap color as a wall of swatches, filter it by matching system or search by code or name, and see each color\'s hex and RGB values and the keysets that use it.',
      },
      {
        icon: 'solar:calendar-mark-bold-duotone',
        title: 'Group Buys on Time',
        description:
          'Live group buys follow their own dates, so a set shows up when its sale opens and leaves when it closes, and the home page lists the ones closing soonest.',
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
        icon: 'solar:bookmark-square-bold-duotone',
        title: 'Collections for Everything',
        description:
          'Create unlimited collections across keyboards, keysets, and artisans and save new finds from any page. Artisan collections can be a shelf of caps you own, a wishlist, or caps for sale or trade, and you can pin the makers, profiles, brands, and keyboards you visit most.',
      },
      {
        icon: 'solar:refresh-circle-bold-duotone',
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
        icon: 'solar:share-bold-duotone',
        title: 'Made to Be Shared',
        description:
          'Share collections by link, and turn your wishlist into an image with prices, Top Priority, and Found or Sold on each cap, in the order you drag them. Any colorway becomes a card to copy or download, in your theme or as a trading card.',
      },
      {
        icon: 'solar:shop-bold-duotone',
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
        icon: 'solar:add-circle-bold-duotone',
        title: 'Community Submissions',
        description:
          'Propose colorways, kits, and keyboard variants, or a whole new sculpt, keyset, or keyboard, through a guided step-by-step wizard, reviewed by moderators before going live.',
      },
      {
        icon: 'solar:pen-new-square-bold-duotone',
        title: 'Suggest an Edit',
        description:
          'Spot a wrong date or a missing photo? Suggest a fix from the page itself, and a moderator reviews it before it changes.',
      },
      {
        icon: 'solar:bell-bold-duotone',
        title: 'Hear Back',
        description:
          'Get notified when a submission is approved or rejected, with the moderator\'s note, and choose what you hear about in your settings.',
      },
    ],
  },
  {
    id: 'yours',
    title: 'Make It Yours',
    description:
      'A catalog you will want to open every day, on any screen.',
    features: [
      {
        icon: 'solar:palette-bold-duotone',
        title: 'Themes Inspired by Keysets',
        description:
          'Pick from a growing set of theme presets, each with its own colors, fonts, and component style, in light, dark, or system mode. Your choice is saved to your account.',
      },
      {
        icon: 'solar:smartphone-bold-duotone',
        title: 'Fast on Every Screen',
        description:
          'Clear layouts that work from phones to wide monitors, with images sized for your device so every page stays fast, even on a phone.',
      },
    ],
  },
]

// Named like the menu link, so it skips the " - Keebdex" suffix
useSeoMeta({
  titleTemplate: '%s',
  title: 'About Keebdex',
  description,
})
</script>
