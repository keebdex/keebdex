<template>
  <UDropdownMenu
    v-if="filteredCollections.length > 1"
    :items="[
      {
        type: 'label',
        label: `${action} to Collection`,
      },
      ...filteredCollections.map((collection) => ({
        label: collection.name,
        disabled: $route.path.includes(collection.id),
        onSelect: () => {
          $emit('onSelect', collection, item)
        },
      })),
    ]"
    :ui="{
      content: 'w-48',
    }"
  >
    <UTooltip :text="move ? 'Move' : 'Save'" :delay-duration="0">
      <UButton
        :id="`${item.colorway_id || item.profile_keyset_id || item.id || 'item'}-save-to`"
        :label="label"
        :icon="icon"
      />
    </UTooltip>
  </UDropdownMenu>
</template>

<script setup>
defineEmits(['onSelect'])

const { category, move } = defineProps({
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

const filteredCollections = computed(() =>
  collections.value.filter((c) => c.category === category),
)
</script>
