<template>
  <UDropdownMenu
    v-if="!move || filteredCollections.length"
    v-bind="$attrs"
    :items="items"
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

  <UModal v-model:open="creating" title="Add Collection">
    <template #body>
      <CollectionModalCollectionForm
        :metadata="{ category }"
        lock-category
        @on-success="creating = false"
      />
    </template>
  </UModal>
</template>

<script setup>
// Two roots (menu + modal): keep parent attrs on the menu as before
defineOptions({ inheritAttrs: false })

const emit = defineEmits(['onSelect'])

const route = useRoute()

const { item, category, move } = defineProps({
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

const creating = ref(false)

// Always offer a way to start a collection, so users without one of this
// category still see the Save button instead of nothing
const items = computed(() => {
  const groups = []

  if (filteredCollections.value.length) {
    groups.push([
      { type: 'label', label: `${action} to Collection` },
      ...filteredCollections.value.map((collection) => ({
        label: collection.name,
        disabled: route.path.includes(collection.id),
        onSelect: () => emit('onSelect', collection, item),
      })),
    ])
  }

  if (!move) {
    groups.push([
      {
        label: 'New Collection',
        icon: 'hugeicons:add-01',
        onSelect: () => {
          creating.value = true
        },
      },
    ])
  }

  return groups
})
</script>
