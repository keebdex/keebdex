<template>
  <UDashboardPanel id="policy">
    <template v-if="$device.isMobile" #header>
      <UDashboardNavbar title="Privacy Policy" />
    </template>

    <template #body>
      <UPageSection
        title="Privacy Policy"
        icon="solar:shield-keyhole-bold-duotone"
        :features="policies"
      >
        <template #description>
          Your privacy matters. At <strong>Keebdex</strong>, we are committed to
          protecting your personal information. This policy explains what we
          collect, how we use it, and your rights.
        </template>
      </UPageSection>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const policies = [
  {
    title: 'Information We Collect',
    description:
      'We collect personal details like your name and email from login providers, along with basic usage data to understand how you interact with Keebdex.',
    icon: 'solar:user-bold-duotone',
  },
  {
    title: 'How We Use Your Information',
    description:
      'Your information is used to provide and improve our services, sync collections across devices, and ensure your account remains secure.',
    icon: 'solar:settings-bold-duotone',
  },
  {
    title: 'Changes to This Policy',
    description:
      'Our Privacy Policy may be updated periodically, and the latest version will always be published on this page and in our GitHub repository.',
    icon: 'solar:document-text-bold-duotone',
  },
  {
    title: 'Your Consent',
    description:
      'By continuing to use Keebdex, you acknowledge and agree to the collection, processing, and use of your information as described in this policy.',
    icon: 'solar:check-circle-bold-duotone',
  },
]
</script>
