<template>
  <section class="flex flex-col gap-8">
    <HomeSectionHeader
      headline="New to artisans?"
      title="Start with the Guides"
      description="ArtisanCollector's recommended reading for newcomers, in order."
    />

    <ol class="grid gap-6 md:grid-cols-3">
      <li v-for="(guide, index) in guides" :key="guide.to" class="flex">
        <UPageFeature
          v-bind="guide"
          target="_blank"
          class="w-full"
          :ui="{
            // A rule above each guide, turning primary with its title
            root: 'group border-t-2 border-default pt-4 transition-colors hover:border-primary',
            title:
              'flex items-start justify-between gap-2 transition-colors group-hover:text-primary',
          }"
        >
          <template #leading>
            <span class="font-mono text-sm text-primary">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
          </template>

          <template #title>
            {{ guide.title }}
            <UIcon
              name="solar:arrow-right-up-linear"
              class="size-4 shrink-0 text-dimmed group-hover:text-primary"
            />
          </template>
        </UPageFeature>
      </li>
    </ol>
  </section>
</template>

<script setup>
const guides = [
  {
    title: 'What are Artisan Keycaps?',
    description:
      'The fundamentals of artisan keycaps, the various stems, profiles, types, how they are typically made, and where to learn more.',
    to: 'https://artisancollector.com/guides/what-are-artisan-keycaps/',
  },
  {
    title: 'Collecting Artisans: Retail Sales',
    description:
      'The various artisan sale types, how they work, platforms on which the sales are run, and notification methods that require monitoring.',
    to: 'https://artisancollector.com/guides/collecting-artisans-retail/',
  },
  {
    title: 'The Three Artisan Collector Resources',
    description:
      'The three main resources that impact your ability to collect artisans, and the relationship between them.',
    to: 'https://artisancollector.com/guides/3-artisan-collecting-resources/',
  },
]
</script>
