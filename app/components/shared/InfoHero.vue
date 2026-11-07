<template>
  <UPageHero
    :title
    :description
    :ui="{
      // The hero stays left aligned above the page's content
      container: `${panelContainerClass} pt-2 pb-10 sm:pt-8 sm:pb-14 lg:pt-8 lg:pb-14 gap-0 sm:gap-y-0`,
      wrapper: 'text-start',
      headline: 'mb-10 sm:mb-12',
      title: 'max-w-4xl text-4xl sm:text-5xl lg:text-6xl text-balance',
      description: 'mt-5 max-w-2xl text-lg sm:text-lg text-pretty',
      footer: 'mt-8',
      links: 'justify-start items-center gap-3',
    }"
  >
    <template #headline>
      <!-- The info pages as a row of keycaps, the current one held down. Each
      legend sits top-left like a real key's, its name below as a sublegend. -->
      <nav aria-label="About Keebdex">
        <ul class="grid grid-cols-6 gap-1.5 sm:flex sm:gap-2">
          <li v-for="(page, index) in pages" :key="page.to">
            <NuxtLink
              :to="page.to"
              :aria-label="page.label"
              :aria-current="page.current ? 'page' : undefined"
              :style="{ '--i': index }"
              :class="[
                'home-key group block rounded-xl bg-accented p-1 shadow-sm ring transition-[padding,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none',
                page.current
                  ? 'pt-2 pb-1 ring-primary/60 shadow-none'
                  : 'pb-2.5 ring-default hover:pt-1.5 hover:pb-2',
              ]"
            >
              <span
                class="flex h-12 flex-col justify-between rounded-lg bg-elevated p-2 sm:h-14 sm:w-22"
              >
                <UIcon
                  :name="page.icon"
                  :class="[
                    'size-5',
                    page.current
                      ? 'text-primary'
                      : 'text-muted group-hover:text-highlighted',
                  ]"
                />
                <span
                  class="hidden truncate text-[11px] leading-none text-dimmed sm:block"
                >
                  {{ page.legend }}
                </span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </template>

    <template v-if="$slots.default" #links>
      <slot />
    </template>
  </UPageHero>
</template>

<script setup lang="ts">
import { INFO_PAGES } from '~/composables/useSidebarNavigation'

// The opening of every info page (/about, /features, /why-choose-keebdex,
// /changelog, /shoutouts, /privacy), a UPageHero: the keycap row that moves
// between them as its headline, then the page's title and description, left
// aligned, and its links (the default slot).
defineProps<{
  title: string
  description?: string
}>()

const route = useRoute()
const pages = computed(() =>
  INFO_PAGES.map((page) => ({ ...page, current: page.to === route.path })),
)
</script>
