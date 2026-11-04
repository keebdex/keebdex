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

      <!-- One UPageSection per part of the policy, its details as the
      section's features -->
      <UPageSection
        v-for="section in sections"
        :id="section.id"
        :key="section.id"
        :title="section.title"
        :description="section.description"
        :features="section.features"
        :links="section.links"
        :ui="sectionUi"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
// Change this whenever the policy's content changes
const UPDATED_AT = '2026-11-04'
const CONTACT_EMAIL = 'contact@keebdex.org'

// The panel already sets the width and gutters
const sectionUi = {
  container: 'max-w-none px-0 sm:px-0 lg:px-0 py-12 sm:py-16 lg:py-16',
}

// Written from what the app stores: keep it true when data or cookies change
const sections = [
  {
    id: 'information-we-keep',
    title: 'Information we keep',
    description:
      'Browsing Keebdex needs no account. When you sign in or add something, we keep only what your sign-in shares and what you add yourself.',
    features: [
      {
        icon: 'solar:user-circle-bold-duotone',
        title: 'Your account',
        description:
          'The name, email address, and profile picture your Google or Discord account shares when you sign in.',
      },
      {
        icon: 'solar:user-rounded-bold-duotone',
        title: 'Your profile',
        description:
          'The Discord, Reddit, or QQ names you add in your settings, and whether you appear on the leaderboard.',
      },
      {
        icon: 'solar:bookmark-square-bold-duotone',
        title: 'Your collections',
        description:
          'The collections you create and what you save to them, including the prices, contact, and message you add to a wishlist or a for-sale collection.',
      },
      {
        icon: 'solar:upload-bold-duotone',
        title: 'Your contributions',
        description:
          'The submissions and edit suggestions you send, the images you upload with them, and who sent each one.',
      },
      {
        icon: 'solar:palette-bold-duotone',
        title: 'Your preferences',
        description:
          'The theme and color mode you pick, so they follow you to every device.',
      },
      {
        icon: 'solar:chat-round-dots-bold-duotone',
        title: 'Feedback',
        description:
          'The messages you send through Feedback. Without an account, also the name and the optional email you enter.',
      },
    ],
  },
  {
    id: 'who-can-see-it',
    title: 'Who can see it',
    description:
      'Your email address is never shown on a public page, and your collections stay private until you share them.',
    features: [
      {
        icon: 'solar:global-bold-duotone',
        title: 'Everyone',
        description:
          'Your name and profile picture on the leaderboard (unless you hide yourself in your settings), the collections and wishlist images you share, the Discord contact of lists in the Trading Hub, and approved submissions as part of the catalog.',
      },
      {
        icon: 'solar:shield-user-bold-duotone',
        title: 'Staff',
        description:
          'The name and email address on the submissions and edit suggestions they review, so they can credit you and follow up, and the messages you send through Feedback.',
      },
      {
        icon: 'solar:lock-keyhole-bold-duotone',
        title: 'Only you',
        description:
          'Your private collections, your preferences, and your email address everywhere else.',
      },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies',
    description:
      'Keebdex uses only the cookies the site needs to work the way you set it up. There are no ads and no advertising or third-party analytics scripts.',
    features: [
      {
        icon: 'solar:login-2-bold-duotone',
        title: 'Sign-in',
        description: 'Keeps you signed in between visits.',
      },
      {
        icon: 'solar:pallete-2-bold-duotone',
        title: 'Appearance',
        description:
          'Remembers your theme, color mode, and sidebar size, even when you are signed out.',
      },
      {
        icon: 'solar:settings-bold-duotone',
        title: 'Your choices',
        description:
          'Remembers that you have seen the cookie notice, and the text format you last copied a wishlist in.',
      },
    ],
  },
  {
    id: 'services-we-use',
    title: 'Services we use',
    description:
      'A few services handle your information on our behalf. We never sell or rent your information to anyone.',
    features: [
      {
        icon: 'simple-icons:supabase',
        title: 'Supabase',
        description: 'Stores the database and handles sign-in.',
      },
      {
        icon: 'simple-icons:cloudflare',
        title: 'Cloudflare',
        description: 'Hosts the site and its images.',
      },
      {
        icon: 'solar:shield-check-bold-duotone',
        title: 'Google and Discord',
        description: 'Confirm who you are when you sign in.',
      },
    ],
  },
  {
    id: 'your-choices',
    title: 'Your choices',
    description: 'You stay in control of what Keebdex keeps and shows.',
    features: [
      {
        icon: 'solar:pen-new-square-bold-duotone',
        title: 'Change your profile',
        description:
          'Edit your social names and leave the leaderboard from your account settings.',
      },
      {
        icon: 'solar:eye-closed-bold-duotone',
        title: 'Control your collections',
        description:
          'Make a shared collection private again, or delete a collection and everything in it.',
      },
      {
        icon: 'solar:user-cross-bold-duotone',
        title: 'Delete your account',
        description:
          'Send us a message through Feedback or by email and we will remove your account and the information tied to it.',
      },
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    description:
      'When this policy changes, we update it on this page and change the date at the top. Using Keebdex after a change means you accept the updated policy.',
  },
  {
    id: 'contact-us',
    title: 'Contact us',
    description:
      'Questions about your data, or a request to see, change, or delete it? Email us and we will get back to you.',
    links: [
      {
        label: CONTACT_EMAIL,
        to: `mailto:${CONTACT_EMAIL}`,
        icon: 'solar:letter-bold-duotone',
        color: 'primary',
        size: 'lg',
        ui: { label: 'block' },
      },
    ],
  },
]

const title = 'Privacy Policy'
const description =
  'What Keebdex keeps about you, who can see it, and how to change or remove it.'

useSeoMeta({ title, description })
</script>
