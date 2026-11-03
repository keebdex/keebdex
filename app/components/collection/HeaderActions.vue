<template>
  <!-- A collection page's header actions, in the detail-page order: the
       page's labeled primary action (default slot, e.g. Share), then Edit and
       Delete as `SharedRecordActions` (a collection has no history), then
       the page's icon-only tools (`tools`, e.g. Manual Sort). Owner only. -->
  <slot />

  <SharedRecordActions
    editable
    :history="false"
    label="Collection"
    @edit="editing = true"
    @delete="deleting.open = true"
  />

  <slot name="tools" />

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
    v-model:open="deleting.open"
    title="Delete Collection"
    :description="`Are you sure you want to delete ${collection?.name}?`"
    :loading="deleting.loading"
    @confirm="confirmDelete"
  />
</template>

<script setup>
const { collection, onDelete } = defineProps({
  collection: {
    type: Object,
    default: null,
  },
  // `deleteCollection` from `useCollection`, which toasts and leaves the page
  onDelete: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['updated'])

const editing = ref(false)
const deleting = reactive({ open: false, loading: false })

const confirmDelete = async () => {
  deleting.loading = true
  await onDelete()
  deleting.loading = false
  deleting.open = false
}
</script>
