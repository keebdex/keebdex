<template>
  <!-- A collection page's header actions, in the detail-page order: the
       page's labeled primary action (default slot, e.g. Share), then Edit and
       Delete as `SharedRecordActions` (no History: a collection has no
       revision history). Owner only. -->
  <slot />

  <SharedRecordActions
    editable
    label="Collection"
    @edit="editing = true"
    @delete="
      openDelete(
        'Collection',
        collection.name,
        `/api/users/${collection.uid}/collections/${collection.id}`,
      )
    "
  />

  <UModal v-model:open="editing" title="Edit Collection">
    <template #body>
      <CollectionModalCollectionForm
        :metadata="collection"
        :is-edit="true"
        @on-success="
          () => {
            editing = false
            emit('updated')
          }
        "
      />
    </template>
  </UModal>

  <SharedConfirmModal
    v-model:open="deleteTarget.open"
    title="Delete Collection"
    :description="`Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`"
    :loading="deleting"
    @confirm="confirmDelete"
  />
</template>

<script setup>
const { collection } = defineProps({
  collection: {
    type: Object,
    default: null,
  },
})

// `deleted` once the collection is gone (`onDeleted` from `useCollection`)
const emit = defineEmits(['updated', 'deleted'])

const editing = ref(false)

const {
  target: deleteTarget,
  deleting,
  open: openDelete,
  confirm: confirmDelete,
} = useConfirmDelete(() => emit('deleted'))
</script>
