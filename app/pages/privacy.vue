<template>
  <UDashboardPanel id="policy">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar :title="title" />
    </template>

    <template #body>
      <UPageSection
        :title="title"
        icon="solar:shield-check-bold-duotone"
        :features="policies"
      >
        <template #description>
          Your privacy matters. At <strong>Keebdex</strong>, we are committed to
          protecting your personal information. This policy outlines how we
          collect, use, and safeguard your data when you use our services.
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
      'We collect information you provide when creating an account, such as your name, email address, and profile details. We also collect data on how you use our services to improve your experience.',
    icon: 'solar:user-bold-duotone',
  },
  {
    title: 'How We Use Your Information',
    description:
      'We use your information to provide and improve our services, communicate with you, and ensure the security of our platform. We do not sell your information to third parties.',
    icon: 'solar:settings-bold-duotone',
  },
  {
    title: 'Changes to This Policy',
    description:
      'We may update this policy from time to time. We will notify you of any changes by posting the new policy on this page. You are advised to review this policy periodically for any changes.',
    icon: 'solar:document-text-bold-duotone',
  },
  {
    title: 'Your Consent',
    description:
      'By using our services, you consent to our privacy policy. If you do not agree with this policy, please do not use our services.',
    icon: 'solar:check-circle-bold-duotone',
  },
]

const title = 'Privacy Policy'
const description =
  'Your privacy matters. This policy outlines how we collect, use, and protect your information when you use Keebdex.'

useSeoMeta({ title, description })
</script>
