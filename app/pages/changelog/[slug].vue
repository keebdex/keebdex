<template>
  <UDashboardPanel v-if="page" :id="route.path">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar title="Changelog" />
    </template>

    <template #body>
      <UPage class="max-w-5xl mx-auto">
        <UPageBody>
          <UPageHeader
            headline="Releases"
            :title="`${page.meta?.version} - ${page.title}`"
            :description="page.description"
            :links="page.meta.links"
          />

          <ContentRenderer v-if="page.body" :value="page" prose />

          <USeparator v-if="surround?.filter(Boolean).length" />

          <UContentSurround :surround="surround" />
        </UPageBody>

        <!-- <template #right>
          <UContentToc
            v-if="page.body && page.body.toc"
            :links="page.body.toc.links"
            title="Table of Contents"
            highlight
          />
        </template> -->
      </UPage>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('changelog').path(route.path).first(),
)

const { data: surround } = await useAsyncData(`${route.path}-surround`, () =>
  queryCollectionItemSurroundings('changelog', route.path, {
    fields: ['description'],
  }),
)

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  title,
  description,
  ogDescription: description,
  ogTitle: title,
})
</script>
