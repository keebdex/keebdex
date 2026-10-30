<template>
  <!-- Icon-only Edit / History / Delete of one record (a page, release,
       variant, kit, or colorway), each named by its tooltip and aria-label.
       Staff edit in place and see History, and Delete where the page handles
       `@delete`; others with `suggestable` get Edit, which suggests an edit.
       Page headers take the theme's button style, like their other actions;
       cards and release rows pass `ghost`. -->
  <div
    v-if="actions.length"
    class="flex items-center"
    :class="ghost ? 'gap-1' : 'gap-2'"
  >
    <!-- Tooltips only in the browser: a grid of cards would otherwise render
         up to three tooltip trees per card on the server, for a label the
         aria-label already gives -->
    <ClientOnly v-for="{ tooltip, ...button } in actions" :key="tooltip">
      <UTooltip :text="tooltip">
        <UButton v-bind="button" />
      </UTooltip>

      <template #fallback>
        <UButton v-bind="button" />
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
  ghost,
  onDelete = undefined,
} = defineProps<{
  // Staff: edit in place, plus History and Delete
  editable?: boolean
  // Others may suggest an edit
  suggestable?: boolean
  // A data rule on top of `@delete`, e.g. a release only once its variants
  // are gone
  deletable?: boolean
  // What the record is, for the buttons' accessible names ("Edit Release")
  label?: string
  ghost?: boolean
  // `@delete`: Delete shows only where the page handles it
  onDelete?: () => void
}>()

const emit = defineEmits<{
  edit: []
  suggest: []
  history: []
}>()

const ariaLabel = (action: string) => (label ? `${action} ${label}` : action)

const actions = computed(() => {
  if (!editable && !suggestable) return []

  const variant = ghost ? ('ghost' as const) : undefined

  const edit = {
    tooltip: 'Edit',
    icon: 'hugeicons:edit-01',
    variant,
    'aria-label': ariaLabel('Edit'),
    onClick: () => (editable ? emit('edit') : emit('suggest')),
  }

  if (!editable) return [edit]

  return [
    edit,
    {
      tooltip: 'History',
      icon: 'hugeicons:time-quarter-pass',
      variant,
      'aria-label': label ? `${label} History` : 'History',
      onClick: () => emit('history'),
    },
    ...(onDelete && deletable
      ? [
          {
            tooltip: 'Delete',
            icon: 'hugeicons:file-remove',
            color: 'error' as const,
            variant,
            'aria-label': ariaLabel('Delete'),
            onClick: onDelete,
          },
        ]
      : []),
  ]
})
</script>
