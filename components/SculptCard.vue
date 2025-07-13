<template>
  <nuxt-link :to="`/artisan/maker/${sculpt.maker_id}/${sculpt.sculpt_id}`">
    <!-- <Card
      class="h-full overflow-hidden"
      :pt="{
        header: 'w-full aspect-square overflow-hidden',
        body: 'flex-1',
        caption: 'flex flex-1 items-center',
        title: 'flex flex-grow text-center',
      }"
    >
      <template #header>
        <img
          loading="lazy"
          :alt="sculpt.name"
          :src="sculpt.img"
          class="w-full h-full object-cover"
        />
      </template>
      <template #title>{{ sculpt.name }}</template>
      <template v-if="sculpt.collection" #subtitle>
        <Tag
          severity="secondary"
          :value="sculpt.collection"
          pt:label:class="font-medium"
        />
      </template>
    </Card> -->

    <UPageCard
      :title="sculpt.name"
      :description="sculpt.collection"
      orientation="vertical"
      reverse
      spotlight
      :ui="{
        root: 'h-full overflow-hidden',
        // wrapper: 'items-center',
        // wrapper:
        //   'flex flex-grow items-center mx-auto p-6 aspect-square overflow-hidden',
      }"
    >
      <NuxtImg
        loading="lazy"
        :alt="sculpt.name"
        :src="sculpt.img"
        class="w-full h-full object-cover"
      />
    </UPageCard>
  </nuxt-link>
</template>

<script setup>
defineProps({
  sculpt: {
    type: Object,
    default: () => ({}),
  },
  favorite: Boolean,
})
</script>
