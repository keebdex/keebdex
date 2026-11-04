<template>
  <UDashboardPanel id="changelog">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar title="Changelog" />
    </template>

    <template #body>
      <SharedInfoHero title="Changelog" :description />

      <!-- Every release on one line, newest first, the one being read
      marked; the arrows scroll the line a screen at a time -->
      <section aria-labelledby="releases-title" class="flex gap-4">
        <h2 id="releases-title" class="sr-only">Releases</h2>

        <div
          ref="releaseLine"
          class="-mx-1 min-w-0 flex-1 snap-x snap-mandatory overflow-x-auto px-1 pb-2 [scrollbar-width:none]"
          @scroll.passive="updateScroll"
        >
          <UTimeline
            v-model="selected"
            :items="versions"
            value-key="tag"
            orientation="horizontal"
            size="3xs"
            color="primary"
            :ui="{
              root: 'w-max',
              // The whole item opens its release; the title stays the
              // button for keyboards and screen readers
              item: 'group/release w-64 flex-none cursor-pointer snap-start',
              indicator:
                'group-data-[state=completed]:bg-elevated group-data-[state=completed]:text-muted',
              separator: 'group-data-[state=completed]:bg-elevated',
              wrapper: 'mt-3 flex flex-col',
              description: 'mt-1 line-clamp-2',
              date: 'order-last mt-2',
            }"
            @select="(_, item) => (selected = item.tag)"
          >
            <template #title="{ item }">
              <button
                type="button"
                :aria-pressed="item.tag === selected"
                class="text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
              >
                <span
                  :class="[
                    'text-base font-semibold group-hover/release:text-primary',
                    item.tag === selected ? 'text-primary' : 'text-highlighted',
                  ]"
                >
                  {{ item.title }}
                </span>
                <span
                  v-if="item.legend"
                  class="ms-1.5 text-sm font-normal text-dimmed"
                >
                  {{ item.legend }}
                </span>
              </button>
            </template>

            <template #description="{ item }">
              {{ item.page.description }}
            </template>

            <template #date="{ item }">
              {{ item.date ? formatDate(item.date) : 'Live now' }}
            </template>
          </UTimeline>
        </div>

        <!-- On the dots' line, beside the release line -->
        <UFieldGroup class="-mt-2 hidden shrink-0 self-start sm:flex">
          <UButton
            icon="hugeicons:arrow-left-01"
            variant="outline"
            aria-label="Newer releases"
            :disabled="!canScroll.back"
            @click="scrollReleases(-1)"
          />
          <UButton
            icon="hugeicons:arrow-right-01"
            variant="outline"
            aria-label="Older releases"
            :disabled="!canScroll.forward"
            @click="scrollReleases(1)"
          />
        </UFieldGroup>
      </section>

      <!-- One release at a time; the others stay rendered (hidden) for
      search engines and direct links -->
      <div class="pb-12">
        <article
          v-for="item in versions"
          v-show="item.tag === selected"
          :key="item.tag"
          class="mt-6 grid gap-8 border-t border-default pt-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16"
        >
          <div class="min-w-0 max-w-2xl">
            <h2
              :id="anchor(item.tag)"
              class="scroll-mt-6 text-3xl font-bold tracking-tight text-balance text-highlighted sm:text-4xl"
            >
              {{ item.title }}
            </h2>

            <ContentRenderer :value="item.page" class="mt-5" />
          </div>

          <!-- What the release is, beside its notes from lg -->
          <dl
            class="flex flex-wrap gap-x-8 gap-y-4 border-t border-default pt-6 text-sm lg:sticky lg:top-0 lg:flex-col lg:self-start lg:border-t-0 lg:pt-0"
          >
            <div>
              <dt class="text-muted">
                {{ item.page.version ? 'Version' : 'Running build' }}
              </dt>
              <dd class="mt-1">
                <UBadge v-bind="item.releaseBadge" />
              </dd>
            </div>
            <div v-if="item.date">
              <dt class="text-muted">Released</dt>
              <dd class="mt-1 font-medium text-highlighted">
                <time :datetime="String(item.date).slice(0, 10)">
                  {{ formatDate(item.date) }}
                </time>
              </dd>
            </div>
            <div v-if="item.authors?.length">
              <dt class="text-muted">Made by</dt>
              <dd class="mt-2 flex flex-col gap-2">
                <UUser
                  v-for="author in item.authors"
                  :key="author.name"
                  v-bind="author"
                  size="sm"
                />
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { useResizeObserver } from '@vueuse/core'

const description =
  'Everything new in Keebdex, release by release. The changes at the top are already live and go out with the next release.'

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
      legend: release.version && `v${release.version}`,
      title:
        release.version || !latestRelease.value
          ? release.title
          : `Since v${latestRelease.value.version}`,
      date: release.date,
      page: release,
      releaseBadge: releaseBadge(release),
      authors: release.authors?.map(toAuthor),
    })),
)

const anchor = (tag) => `release-${tag.replaceAll('.', '-')}`

// The release being read follows the hash, so a link to a release opens
// it, and picking one in the line updates the address
const route = useRoute()
const router = useRouter()
const tagFromHash = (hash) =>
  versions.value.find(
    (version) => `#${anchor(version.tag)}` === decodeURIComponent(hash),
  )?.tag

const selected = ref(versions.value[0]?.tag)

watch(
  () => route.hash,
  (hash) => {
    const tag = tagFromHash(hash)
    if (tag) selected.value = tag
  },
  { immediate: true },
)

// The release line scrolls sideways: the arrows move it a screen at a
// time, and are off at either end
const releaseLine = useTemplateRef('releaseLine')
const canScroll = reactive({ back: false, forward: false })

const updateScroll = () => {
  const line = releaseLine.value
  if (!line) return
  // A few pixels of slack: the snap stops at the line's side padding
  canScroll.back = line.scrollLeft > 8
  canScroll.forward = line.scrollLeft + line.clientWidth < line.scrollWidth - 8
}

const scrollReleases = (direction) =>
  releaseLine.value?.scrollBy({
    left: direction * releaseLine.value.clientWidth,
    behavior: 'smooth',
  })

// A direct link to an older release brings it into the line's view
onMounted(() => {
  updateScroll()
  const index = versions.value.findIndex((v) => v.tag === selected.value)
  const item = releaseLine.value?.querySelectorAll('[data-slot=item]')[index]
  item?.scrollIntoView({ block: 'nearest', inline: 'start' })
})
useResizeObserver(releaseLine, updateScroll)

// A release picked after scrolling down a long one brings its title back
// into view; the panel body is the scroller
watch(selected, async (tag) => {
  const hash = `#${anchor(tag)}`
  if (route.hash !== hash) router.replace({ hash })

  await nextTick()
  const title = document.getElementById(anchor(tag))
  if (title && title.getBoundingClientRect().top < 0) {
    title.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})

useSeoMeta({
  title: 'Changelog',
  description,
})
</script>
