<template>
  <UDropdownMenu
    :items="[
      {
        type: 'label',
        label: `${action} to Collection`,
      },
      ...collections
        .filter((c) => c.category === category)
        .map((collection) => ({
          label: collection.name,
          onSelect: () => {
            $emit('onSelect', collection, item)
          },
        })),
    ]"
    :ui="{
      content: 'w-48',
    }"
  >
    <UButton :label="label" :icon="icon" />
  </UDropdownMenu>
</template>

<script setup>
defineEmits(['onSelect'])

const { move } = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  category: {
    type: String,
    default: 'artisan',
  },
  move: Boolean,
  label: {
    type: String,
    default: undefined,
  },
  icon: {
    type: String,
    default: 'hugeicons:bookmark-add-02',
  },
})

const action = move ? 'Move' : 'Save'

const userStore = useUserStore()
const { collections } = storeToRefs(userStore)
</script>
