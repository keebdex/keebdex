<template>
  <draggable
    :list="wishlist"
    item-key="id"
    group="group"
    class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
  >
    <template #item="{ element }">
      <Card
        :key="element.element_id"
        class="overflow-hidden"
        :pt="{
          header: 'relative w-full h-44 md:h-60',
          body: 'flex-1 items-center',
          caption: 'flex flex-1 items-center',
          title: 'flex flex-grow text-center',
        }"
      >
        <template #header>
          <img
            loading="lazy"
            :alt="element.artisan.name"
            :src="element.artisan.img"
            class="h-full absolute inset-0 object-cover"
            :class="{
              grayscale: !element.exchange,
            }"
          />
          <span
            v-if="!element.exchange"
            class="absolute inset-0 !flex items-center justify-center !text-[120px]"
            :class="{
              'pi pi-check-circle text-green-400': buying,
              'pi pi-eye-slash text-red-600': selling,
            }"
          />
        </template>
        <template #title>{{ element.artisan.name || '-' }}</template>
        <template #subtitle>{{ element.artisan?.sculpt.name }}</template>

        <template #footer>
          <Button
            v-if="!copying"
            text
            size="small"
            severity="danger"
            label="Remove"
            @click="$emit('onRemove', element)"
          />
        </template>
      </Card>
    </template>
  </draggable>

  <ConfirmDialog />
</template>

<script setup>
import sortBy from 'lodash.sortby'
import draggable from 'vuedraggable'

defineEmits(['onRemove'])

const wishlist = ref([])

const { data } = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  copying: Boolean,
  buying: Boolean,
  selling: Boolean,
})

onBeforeMount(() => {
  wishlist.value = sortBy(data, 'id')
})

watch(
  () => data,
  () => {
    wishlist.value = sortBy(data, 'id')
  },
)
</script>
