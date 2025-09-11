<template>
  <UDashboardPanel id="changelog">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar title="Changelog" />
    </template>

    <template #body>
      <UPageSection
        title="Changelog"
        :description
        icon="solar:history-bold-duotone"
      >
        <UChangelogVersions :versions="versions" :indicator="false" />
      </UPageSection>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const description =
  'Updates, improvements, and fixes to Keebdex. We ship continuously — here are the highlights.'

const badgeProps = {
  color: 'primary',
  variant: 'soft',
}

const authors = [
  {
    name: 'Anh Thang',
    description: '@anhthang',
    avatar: {
      src: 'https://github.com/anhthang.png',
    },
    to: 'https://github.com/anhthang',
    target: '_blank',
  },
]

const { data: versions } = await useAsyncData(
  'all-changelog',
  () => queryCollection('changelog').all(),
  {
    transform: (data) => {
      return data
        .map((version, idx) => {
          const { title, description, meta, path: to } = version

          return {
            badge: {
              label: meta.version,
              ...badgeProps,
              color: idx === data.length - 1 ? 'info' : 'primary',
            },
            title,
            description,
            ...meta,
            authors,
            to,
            // image: `/changelog/${meta.version}.png`,
          }
        })
        .reverse()
    },
  },
)

useSeoMeta({
  title: 'Changelog',
  description,
})
</script>
