<template>
  <UPageHeader :title="maker.name">
    <template v-if="maker.bio" #description>
      <PageHeaderDescription :description="maker.bio" />
    </template>

    <template #links>
      <UButton
        v-for="link in links"
        :key="link.label"
        :target="link.to?.startsWith('http') ? '_blank' : undefined"
        :disabled="!link.to"
        v-bind="link"
      />

      <UDropdownMenu
        v-if="documents.length"
        :items="documents"
        :ui="{ content: 'min-w-fit' }"
      >
        <UButton label="Catalogue" icon="hugeicons:files-02" />
      </UDropdownMenu>
    </template>

    <UPageGrid v-if="sculpts.length" class="mt-8">
      <SculptCard v-for="sculpt in sculpts" :key="sculpt.id" :sculpt="sculpt" />
    </UPageGrid>
  </UPageHeader>
</template>

<script setup>
const { maker } = defineProps({
  maker: {
    type: Object,
    default: () => ({}),
  },
  sculpts: {
    type: Array,
    default: () => [],
  },
})

const links = []
if (maker.website) {
  links.push({
    label: 'Website',
    icon: 'hugeicons:globe-02',
    to: maker.website,
    target: '_blank',
  })
}
if (maker.instagram) {
  links.push({
    label: 'Instagram',
    icon: 'hugeicons:instagram',
    to: maker.instagram,
    target: '_blank',
  })
}
if (maker.discord) {
  links.push({
    label: 'Discord',
    icon: 'hugeicons:discord',
    to: maker.discord,
    target: '_blank',
  })
}
if (maker.artisancollector) {
  links.push({
    label: 'ArtisanCollector',
    icon: 'hugeicons:globe-02',
    to: maker.artisancollector,
    target: '_blank',
  })
}

const documents = []
if (Array.isArray(maker.document_ids) && maker.document_ids.length) {
  if (maker.document_ids.length > 1) {
    maker.document_ids.forEach((docId, idx) => {
      documents.push({
        label: `Part ${idx + 1}`,
        icon: 'hugeicons:file-02',
        to: `https://docs.google.com/document/d/${docId}`,
        target: '_blank',
      })
    })
  } else {
    links.push({
      label: 'Catalogue',
      icon: 'hugeicons:file-02',
      to: `https://docs.google.com/document/d/${maker.document_ids[0]}`,
      target: '_blank',
    })
  }
}
</script>
