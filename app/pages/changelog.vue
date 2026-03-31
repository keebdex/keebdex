<template>
  <UDashboardPanel id="changelog">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar title="Changelog" />
    </template>

    <template #body>
      <UPageSection
        title="What's New"
        :description
        icon="solar:history-bold-duotone"
      >
        <UChangelogVersions
          as="main"
          :indicator-motion="false"
          :ui="{
            root: 'py-16 sm:py-24 lg:py-32',
            indicator: 'inset-y-0',
          }"
        >
          <UChangelogVersion
            v-for="version in versions"
            :key="version.tag"
            v-bind="version"
            :ui="{
              root: 'flex items-start',
              container: 'max-w-xl min-w-0',
              header: 'border-b border-default pb-4',
              title: 'text-3xl',
              date: 'text-xs/9 text-highlighted font-mono',
              indicator:
                'sticky top-0 pt-16 -mt-16 sm:pt-24 sm:-mt-24 lg:pt-32 lg:-mt-32',
            }"
          >
            <template #body>
              <MDC v-if="version.markdown" :value="version.markdown" />
            </template>
          </UChangelogVersion>
        </UChangelogVersions>
      </UPageSection>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const description =
  'See every update and improvement we ship. Built with your feedback, designed for collectors.'

const { data: versions } = await useFetch(
  computed(() => `https://ungh.cc/repos/keebdex/keebdex/releases`),
  {
    transform: (data) => {
      return data.releases.map((release) => ({
        tag: release.tag,
        title: release.name || release.tag,
        date: release.publishedAt,
        markdown: release.markdown,
        authors: [
          {
            name: release.author,
            // description: `@${release.author}`,
            avatar: {
              src: `https://github.com/${release.author}.png`,
            },
            to: `https://github.com/${release.author}`,
            target: '_blank',
          },
        ],
      }))
    },
  },
)

useSeoMeta({
  title: 'Changelog',
  description,
})
</script>
