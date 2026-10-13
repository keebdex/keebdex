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
            v-for="{ page, ...version } in versions"
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
              <ContentRenderer :value="page" />
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

// Releases live in content/changelog, one file per version (see
// content.config.ts), so the page needs no GitHub API at runtime. The notes
// for the next release (no version yet) come first.
const { data: releases } = await useAsyncData('changelog', () =>
  queryCollection('changelog').order('date', 'DESC').all(),
)

// Released versions show their number, pre-releases say so, and the notes
// for the next release (already live, just not versioned) read as Latest.
const releaseBadge = ({ version, prerelease }) => {
  if (!version) return { label: 'Latest', color: 'info', variant: 'subtle' }
  if (prerelease) {
    return { label: 'Pre-release', color: 'warning', variant: 'subtle' }
  }
  return { label: `v${version}`, color: 'success', variant: 'subtle' }
}

const toAuthor = (author) =>
  typeof author === 'string'
    ? {
        name: author,
        avatar: { src: `https://github.com/${author}.png` },
        to: `https://github.com/${author}`,
        target: '_blank',
      }
    : {
        name: author.name,
        avatar: author.avatar
          ? { src: author.avatar }
          : {
              icon: author.icon,
              text: author.name.charAt(0),
              style: author.color && { color: author.color },
              ui: author.color && { icon: 'text-current' },
            },
        to: author.to,
        target: author.to ? '_blank' : undefined,
      }

const versions = computed(() =>
  (releases.value || [])
    .toSorted((a, b) => Number(!!a.version) - Number(!!b.version))
    .map((release) => ({
      tag: release.version || 'unreleased',
      title: release.title,
      date: release.date,
      page: release,
      badge: releaseBadge(release),
      authors: release.authors?.map(toAuthor),
    })),
)

useSeoMeta({
  title: 'Changelog',
  description,
})
</script>
