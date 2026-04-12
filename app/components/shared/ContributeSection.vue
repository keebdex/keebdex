<template>
  <UPageSection
    :icon="icon"
    :title="title"
    :description="description"
    :links="[
      {
        label: 'Get in Touch',
        icon: 'hugeicons:message-add-01',
        onClick: () => {
          open = true
        },
      },
    ]"
  />

  <UModal v-model:open="open" title="Share your thoughts!">
    <template #body="{ close }">
      <ModalFeedbackForm
        @on-success="
          () => {
            close()
            open = false
          }
        "
      />
    </template>
  </UModal>
</template>

<script setup>
const open = ref(false)

defineProps({
  icon: {
    type: String,
    default: 'hugeicons:keyboard',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
})
</script>
