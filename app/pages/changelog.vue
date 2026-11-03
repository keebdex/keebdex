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

        <div
          class="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10"
        >
          <UChangelogVersions
            as="main"
            :ui="{ root: 'py-8 sm:py-12' }"
            :indicator-motion="false"
          >
            <UChangelogVersion
              v-for="{ page, ...version } in versions"
              :key="version.tag"
              v-bind="version"
              :ui="{
                container: 'max-w-xl min-w-0 lg:ms-40',
                header: 'border-b border-default pb-4',
                title: 'text-3xl',
              }"
            >
              <template #title>
                <span
                  :id="anchor(version.tag)"
                  class="scroll-mt-28 lg:scroll-mt-16"
                >
                  {{ version.title }}
                </span>
              </template>

              <template #body>
                <ContentRenderer :value="page" />
              </template>
            </UChangelogVersion>
          </UChangelogVersions>

          <UContentToc
            title="Releases"
            :links="tocLinks"
            highlight
            class="order-first lg:order-last lg:self-start"
            :ui="{
              root: '-top-4 sm:-top-6 max-h-svh',
              linkText: 'flex-1',
            }"
            @move="scrollToRelease"
          >
            <template #link="{ link }">
              <span class="min-w-0 flex-1 truncate">{{ link.text }}</span>
              <span class="ms-2 shrink-0 font-mono text-xs text-dimmed">
                {{ link.version }}
              </span>
            </template>
          </UContentToc>
        </div>
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

// The top glow fades in once the page has mounted.
const glowVisible = ref(false)
onMounted(() => requestAnimationFrame(() => (glowVisible.value = true)))

// The unreleased notes are titled after the release they follow, so they do
// not read as unavailable. Releases come newest first.
const latestRelease = computed(() =>
  releases.value?.find((release) => release.version),
)

const versions = computed(() =>
  (releases.value || [])
    .toSorted((a, b) => Number(!!a.version) - Number(!!b.version))
    .map((release) => ({
      tag: release.version || 'unreleased',
      title:
        release.version || !latestRelease.value
          ? release.title
          : `Since v${latestRelease.value.version}`,
      date: release.date,
      page: release,
      badge: releaseBadge(release),
      authors: release.authors?.map(toAuthor),
    })),
)

const anchor = (tag) => `release-${tag.replaceAll('.', '-')}`

// The Releases index (UContentToc) spies on each release title. Its links
// push the hash through the router, which scrolls only the window, so the
// panel body is scrolled here, also for a direct link with a hash. The
// router's own scroll runs after the push and would cut a smooth scroll
// short, so this one waits a frame.
const tocLinks = computed(() =>
  versions.value.map(({ tag, title }) => ({
    id: anchor(tag),
    text: title,
    depth: 2,
    version: tag === 'unreleased' ? 'Live' : `v${tag}`,
  })),
)

const scrollToRelease = (id, behavior = 'smooth') =>
  requestAnimationFrame(() =>
    document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' }),
  )

const route = useRoute()
onMounted(() => {
  if (route.hash)
    scrollToRelease(decodeURIComponent(route.hash.slice(1)), 'instant')
})

useSeoMeta({
  title: 'Changelog',
  description,
})
</script>
