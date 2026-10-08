<template>
  <div class="flex items-center justify-between gap-2">
    <UButton
      label="Back"
      variant="soft"
      :disabled="!wizard.stepper?.hasPrev || !!wizard.savingAction"
      @click="wizard.stepper?.prev()"
    />

    <UButton
      v-if="wizard.stepper?.hasNext"
      label="Next"
      trailing-icon="hugeicons:arrow-right-02"
      :disabled="!wizard.canAdvanceStep"
      @click="wizard.onNext"
    />

    <div
      v-else-if="wizard.mode === 'review'"
      class="flex flex-wrap items-center justify-end gap-2"
    >
      <UButton
        v-if="wizard.canSave && !userStore.isModerator"
        label="Save Changes"
        color="primary"
        :loading="wizard.savingAction === 'update'"
        :disabled="wizard.reviewBusy"
        @click="wizard.onReviewAction('update')"
      />

      <UButton
        v-if="userStore.isModerator"
        label="Save & Approve"
        color="success"
        icon="hugeicons:checkmark-circle-02"
        :loading="wizard.savingAction === 'approve'"
        :disabled="wizard.reviewBusy"
        @click="wizard.onReviewAction('approve')"
      />

      <UButton
        v-if="wizard.canDelete"
        label="Delete"
        color="error"
        variant="soft"
        icon="hugeicons:delete-02"
        :disabled="wizard.reviewBusy"
        @click="deleteOpen = true"
      />
    </div>

    <UButton
      v-else
      :label="submitLabel"
      color="primary"
      :loading="wizard.uploading"
      :disabled="wizard.hasUploadingImages"
      @click="wizard.onSubmit"
    />

    <SharedConfirmModal
      v-if="wizard.mode === 'review'"
      v-model:open="deleteOpen"
      :title="`Delete ${wizard.entity}`"
      :description="`Are you sure you want to delete ${wizard.label || `this ${wizard.entity.toLowerCase()}`}? This action cannot be undone.`"
      :loading="wizard.savingAction === 'delete'"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SubmissionWizardActions } from '~/composables/useSubmissionWizardActions'

const props = defineProps({
  // From useSubmissionWizardActions.
  wizard: {
    type: Object as PropType<SubmissionWizardActions>,
    required: true,
  },
  // Create-mode submit button, e.g. "Submit Kits".
  submitLabel: {
    type: String,
    required: true,
  },
})

const userStore = useUserStore()
const deleteOpen = ref(false)

const onDeleteConfirm = async () => {
  if (await props.wizard.onDeleteConfirm()) deleteOpen.value = false
}
</script>
