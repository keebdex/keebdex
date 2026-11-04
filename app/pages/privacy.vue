<template>
  <UDashboardPanel id="policy">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar :title="title" />
    </template>

    <template #body>
      <SharedInfoHero :title :description>
        <p class="text-sm text-dimmed">
          Last updated
          <time :datetime="UPDATED_AT">{{ formatDate(UPDATED_AT) }}</time>
        </p>
      </SharedInfoHero>

      <UPage
        class="gap-10 pb-14"
        :ui="{ left: 'lg:col-span-3', center: 'lg:col-span-7' }"
      >
        <!-- On this page, sticking beside the policy from lg and above it
        on smaller screens, where the aside would otherwise be hidden; the
        panel body scrolls, so it sticks to its top. Plain fragment links:
        the browser scrolls the panel body to them -->
        <template #left>
          <UPageAside
            :ui="{ root: 'block py-0 lg:top-0 lg:max-h-svh lg:self-start lg:py-0' }"
          >
            <nav aria-labelledby="policy-contents">
              <h2
                id="policy-contents"
                class="text-sm font-semibold text-highlighted"
              >
                On this page
              </h2>
              <ul class="mt-3 flex flex-col gap-2 border-s border-default">
                <li v-for="section in sections" :key="section.id">
                  <a
                    :href="`#${section.id}`"
                    class="-ms-px block border-s border-transparent ps-4 text-sm text-muted hover:border-primary hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {{ section.title }}
                  </a>
                </li>
              </ul>
            </nav>
          </UPageAside>
        </template>

        <div class="min-w-0">
          <!-- The whole policy in four sentences -->
          <UPageCard
            as="aside"
            variant="subtle"
            aria-labelledby="policy-summary"
            class="max-w-3xl"
          >
            <h2
              id="policy-summary"
              class="text-lg font-semibold text-highlighted"
            >
              The short version
            </h2>
            <ul class="mt-4 flex flex-col gap-3">
              <li
                v-for="point in summary"
                :key="point.text"
                class="flex gap-3 text-pretty text-default"
              >
                <UIcon
                  :name="point.icon"
                  class="mt-0.5 size-5 shrink-0 text-primary"
                />
                {{ point.text }}
              </li>
            </ul>
          </UPageCard>

          <section
            v-for="section in sections"
            :id="section.id"
            :key="section.id"
            class="mt-12 max-w-3xl scroll-mt-4"
          >
            <h2 class="text-2xl font-semibold text-highlighted">
              {{ section.title }}
            </h2>
            <p
              v-if="section.intro"
              class="mt-3 leading-7 text-pretty text-muted"
            >
              {{ section.intro }}
            </p>
            <dl
              v-if="section.items"
              class="mt-5 divide-y divide-default border-y border-default"
            >
              <div
                v-for="item in section.items"
                :key="item.term"
                class="grid gap-1 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
              >
                <dt class="font-medium text-highlighted">{{ item.term }}</dt>
                <dd class="leading-7 text-pretty text-muted">
                  {{ item.detail }}
                </dd>
              </div>
            </dl>
            <p
              v-if="section.outro"
              class="mt-4 leading-7 text-pretty text-muted"
            >
              {{ section.outro }}
            </p>
          </section>
        </div>
      </UPage>
    </template>
  </UDashboardPanel>
</template>

<script setup>
// Change this whenever the policy's content changes
const UPDATED_AT = '2026-11-04'

const summary = [
  {
    icon: 'hugeicons:user-account',
    text: 'We keep only what your Google or Discord sign-in shares and what you add to Keebdex yourself.',
  },
  {
    icon: 'hugeicons:view-off-slash',
    text: 'Your email address is never shown on public pages, and private collections stay private.',
  },
  {
    icon: 'hugeicons:cookie',
    text: 'Cookies keep you signed in and remember your theme. There are no ads and no tracking scripts.',
  },
  {
    icon: 'hugeicons:cancel-01',
    text: 'We never sell your information, and you can ask us to delete your account at any time.',
  },
]

const sections = [
  {
    id: 'what-we-collect',
    title: 'What we collect',
    intro:
      'Browsing Keebdex needs no account. When you sign in or add something, we keep the following:',
    items: [
      {
        term: 'Your account',
        detail:
          'The name, email address, and profile picture your Google or Discord account shares when you sign in.',
      },
      {
        term: 'Your profile',
        detail:
          'The Discord, Reddit, or QQ names you add in your settings, and whether you appear on the leaderboard.',
      },
      {
        term: 'Your collections',
        detail:
          'The collections you create and what you save to them, including the prices, contact, and message you add to a wishlist or a for-sale collection.',
      },
      {
        term: 'Your contributions',
        detail:
          'The submissions and edit suggestions you send, the images you upload with them, and who sent each one.',
      },
      {
        term: 'Your preferences',
        detail: 'The theme and color mode you pick, so they follow you to every device.',
      },
      {
        term: 'Feedback',
        detail:
          'The messages you send through Feedback. Without an account, that is also the name and the optional email you enter.',
      },
    ],
  },
  {
    id: 'who-can-see-it',
    title: 'Who can see it',
    items: [
      {
        term: 'Everyone',
        detail:
          'Your name and profile picture on the leaderboard (unless you hide yourself in your settings), and the collections you make public by sharing them, with their Discord contact when they are listed in the Trading Hub.',
      },
      {
        term: 'Moderators',
        detail:
          'The name and email address on the submissions and edit suggestions they review, so they can credit you and follow up.',
      },
      {
        term: 'Only you',
        detail:
          'Your private collections, your preferences, and your email address everywhere else.',
      },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies',
    intro:
      'Keebdex uses a few cookies, all of them needed for the site to work the way you set it up:',
    items: [
      {
        term: 'Sign-in',
        detail: 'Keeps you signed in between visits.',
      },
      {
        term: 'Appearance',
        detail: 'Remembers your theme and color mode, even when you are signed out.',
      },
      {
        term: 'Your choices',
        detail:
          'Remembers that you have seen the cookie notice, and the text format you last copied a wishlist in.',
      },
    ],
    outro:
      'Keebdex shows no ads and runs no advertising or third-party analytics scripts.',
  },
  {
    id: 'services-we-use',
    title: 'Services we use',
    intro:
      'Keebdex is built on a few services that handle your information on our behalf: Supabase stores the database and handles sign-in, Cloudflare hosts the site and its images, and Google or Discord confirm who you are when you sign in. We do not sell or rent your information to anyone.',
  },
  {
    id: 'your-choices',
    title: 'Your choices',
    items: [
      {
        term: 'Change your profile',
        detail:
          'Edit your social names and leave the leaderboard from your account settings.',
      },
      {
        term: 'Control your collections',
        detail:
          'Make a shared collection private again, or delete a collection and everything in it.',
      },
      {
        term: 'Delete your account',
        detail:
          'Send us a message through Feedback and we will remove your account and the information tied to it.',
      },
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    intro:
      'When this policy changes, we update it on this page and change the date at the top. Using Keebdex after a change means you accept the updated policy.',
  },
]

const title = 'Privacy Policy'
const description =
  'What Keebdex keeps about you, who can see it, and how to change or remove it.'

useSeoMeta({ title, description })
</script>
