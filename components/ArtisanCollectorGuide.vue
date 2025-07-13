<template>
  <UPageSection title="ArtisanCollector's Guides" :features="features" />
</template>

<script setup>
const features = [
  {
    title: 'Start Here: Collecting Roadmap',
    description:
      'An overview of the Artisan Collector guides and recommended reading sequence for newcomers',
    to: 'https://artisancollector.com/guides/start/',
    target: '_blank',
    icon: 'hugeicons:book-02',
  },
  {
    title: 'What are Artisan Keycaps?',
    description:
      'The fundamentals of artisan keycaps, the various stems, profiles, types, how they are typically made, and where to learn more',
    to: 'https://artisancollector.com/guides/what-are-artisan-keycaps/',
    target: '_blank',
    icon: 'hugeicons:maps-location-01',
  },
  {
    title: 'Collecting Artisans: Retail Sales',
    description:
      'The various artisan sale types, how they work, platforms on which the sales are run, and notification methods that require monitoring.',
    to: 'https://artisancollector.com/guides/collecting-artisans-retail/',
    target: '_blank',
    icon: 'hugeicons:tags',
  },
  {
    title: 'The Three Artisan Collector Resources',
    description:
      'The three main resources that impact your ability to collect artisans, and the relationship between them',
    to: 'https://artisancollector.com/guides/3-artisan-collecting-resources/',
    target: '_blank',
    icon: 'hugeicons:resources-add',
  },
]
</script>
