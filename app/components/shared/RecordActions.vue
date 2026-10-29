<template>
  <!-- Icon-only Edit / History / Delete of one record (a release, variant,
       kit, or colorway). Staff edit in place and see History and Delete;
       others with `suggestable` get Edit, which suggests an edit. -->
  <div v-if="actions.length" class="flex items-center gap-1">
    <!-- Tooltips only in the browser: a grid of cards would otherwise render
         up to three tooltip trees per card on the server, for a label the
         aria-label already gives -->
    <ClientOnly v-for="{ tooltip, ...button } in actions" :key="tooltip">
      <UTooltip :text="tooltip">
        <UButton v-bind="button" variant="ghost" />
      </UTooltip>

      <template #fallback>
        <UButton v-bind="button" variant="ghost" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const {
  editable,
  suggestable,
  label = '',
  deletable = true,
} = defineProps<{
  // Staff: edit in place, plus History and Delete
  editable?: boolean
  // Others may suggest an edit
  suggestable?: boolean
  deletable?: boolean
  // What the record is, for the buttons' accessible names ("Edit Release")
  label?: string
}>()

const emit = defineEmits<{
  edit: []
  suggest: []
  history: []
  delete: []
}>()

const ariaLabel = (action: string) => (label ? `${action} ${label}` : action)

const actions = computed(() => {
  if (!editable && !suggestable) return []

  const edit = {
    tooltip: 'Edit',
    icon: 'hugeicons:edit-01',
    'aria-label': ariaLabel('Edit'),
    onClick: () => (editable ? emit('edit') : emit('suggest')),
  }

  if (!editable) return [edit]

  return [
    edit,
    {
      tooltip: 'History',
      icon: 'hugeicons:time-quarter-pass',
      'aria-label': label ? `${label} History` : 'History',
      onClick: () => emit('history'),
    },
    ...(deletable
      ? [
          {
            tooltip: 'Delete',
            icon: 'hugeicons:file-remove',
            color: 'error' as const,
            'aria-label': ariaLabel('Delete'),
            onClick: () => emit('delete'),
          },
        ]
      : []),
  ]
})
</script>
