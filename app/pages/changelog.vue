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
        :ui="{ body: 'mt-0' }"
      >
        <template #top>
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -inset-x-4 -top-4 -z-10 h-48 sm:-inset-x-6 sm:-top-6 bg-linear-to-b from-primary/15 to-transparent transition-opacity duration-700 motion-reduce:transition-none"
            :class="glowVisible ? 'opacity-100' : 'opacity-0'"
          >
            <div
              class="h-px bg-linear-to-r from-transparent via-primary to-transparent"
            />
          </div>
        </template>

        <UChangelogVersions
          as="main"
          :indicator-motion="false"
          :ui="{
            indicator:
              'inset-y-0 bg-transparent bg-linear-to-b from-primary/60 via-(--ui-border) via-30% to-transparent',
          }"
        >
          <UChangelogVersion
            v-for="{ page, dot, ...version } in versions"
            :key="version.tag"
            v-bind="version"
            :ui="{
              ...dot,
              root: 'group/version flex items-start',
              container: 'max-w-xl min-w-0',
              header: 'border-b border-default pb-4',
              title:
                'text-3xl transition-colors duration-300 group-hover/version:text-primary',
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
// for the next release (already live, just not versioned) show the running
// build, `v<version>+<commit>` (`buildId` in nuxt.config.ts).
const { buildId } = useRuntimeConfig().app

const releaseBadge = ({ version, prerelease }) => {
  if (!version) return { label: buildId, color: 'info', variant: 'subtle' }
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
              // Logos read small at the avatar's 1em icon size
              ui: { icon: author.color ? 'size-5 text-current' : 'size-5' },
            },
        to: author.to,
        target: author.to ? '_blank' : undefined,
      }

// Timeline dots follow the badge color; the unreleased notes pulse, since
// those changes are live right now.
const releaseDot = ({ version, prerelease }) => {
  if (!version) {
    return {
      dot: 'ring-info/50',
      dotInner: 'bg-info motion-safe:animate-pulse',
    }
  }
  return {
    dot: 'transition-transform duration-300 group-hover/version:scale-125',
    dotInner: prerelease ? 'bg-warning' : 'bg-success',
  }
}

// The top glow fades in once the page has mounted.
const glowVisible = ref(false)
onMounted(() => requestAnimationFrame(() => (glowVisible.value = true)))

// The unreleased notes are titled after the release they follow, so they do
// not read as unavailable. Releases come newest first.
const latestVersion = computed(
  () => releases.value?.find((release) => release.version)?.version,
)

const versions = computed(() =>
  (releases.value || [])
    .toSorted((a, b) => Number(!!a.version) - Number(!!b.version))
    .map((release) => ({
      tag: release.version || 'unreleased',
      title:
        release.version || !latestVersion.value
          ? release.title
          : `Since v${latestVersion.value}`,
      date: release.date,
      page: release,
      badge: releaseBadge(release),
      dot: releaseDot(release),
      authors: release.authors?.map(toAuthor),
    })),
)

useSeoMeta({
  title: 'Changelog',
  description,
})
</script>
