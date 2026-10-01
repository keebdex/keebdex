<template>
  <div class="space-y-6">
    <UStepper
      ref="stepper"
      v-model="active"
      :items="items"
      disabled
      class="w-full"
    >
      <template #maker>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Pick the maker this colorway belongs to.
          </p>

          <USelectMenu
            v-model="maker.id"
            :items="makerOptions"
            :loading="makersStatus === 'pending'"
            :disabled="mode === 'review'"
            value-key="value"
            label-key="label"
            placeholder="Select a maker"
            class="w-full"
          />
        </div>
      </template>

      <template #sculpt>
        <div class="space-y-4">
          <UTabs
            v-if="mode === 'create' && sculptOptions.length"
            v-model="sculptMode"
            :items="sculptModeTabs"
            size="sm"
          />

          <p
            v-if="mode === 'review' && sculptReviewStatus === 'Pending'"
            class="text-sm text-muted"
          >
            This sculpt was proposed together with the colorway below and is
            still Pending — review and edit it here before approving.
          </p>

          <USelectMenu
            v-if="sculptMode === 'existing'"
            v-model="existingSculpt.id"
            :items="sculptOptions"
            :loading="sculptsStatus === 'pending'"
            :disabled="mode === 'review'"
            value-key="value"
            label-key="label"
            placeholder="Select a sculpt"
            class="w-full"
          />

          <ArtisanModalSculptForm
            v-if="sculptMode === 'new'"
            v-model="sculpt"
            :sculpts="sculpts"
            mode="embedded"
          />
        </div>
      </template>

      <template #colorway>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Add one or more colorways for this sculpt.
          </p>

          <div
            v-for="(colorway, index) in colorways"
            :key="colorway._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-dimmed">
                Colorway #{{ index + 1 }}
              </p>

              <UButton
                aria-label="Remove colorway"
                size="xs"
                color="error"
                variant="ghost"
                icon="hugeicons:delete-02"
                :disabled="colorways.length === 1"
                @click="removeColorway(index)"
              />
            </div>

            <ArtisanModalColorwayForm
              v-model="colorways[index]"
              :maker-id="maker.id"
              mode="embedded"
            />
          </div>

          <UButton
            label="Add Colorway"
            size="xs"
            variant="soft"
            icon="hugeicons:plus-sign"
            block
            @click="addColorway"
          />
        </div>
      </template>
    </UStepper>

    <div class="flex items-center justify-between gap-2">
      <UButton
        label="Back"
        variant="soft"
        :disabled="!stepper?.hasPrev"
        @click="stepper?.prev()"
      />

      <UButton
        v-if="stepper?.hasNext"
        label="Next"
        trailing-icon="hugeicons:arrow-right-02"
        :disabled="!canAdvance[active]"
        @click="onNext"
      />

      <div
        v-else-if="mode === 'review' && userStore.isModerator"
        class="flex flex-wrap items-center justify-end gap-2"
      >
        <UButton
          label="Save Changes"
          color="primary"
          :loading="savingAction === 'update'"
          @click="onReviewAction('update')"
        />
        <UButton
          label="Approve"
          color="success"
          icon="hugeicons:checkmark-circle-02"
          :loading="savingAction === 'approve'"
          @click="onReviewAction('approve')"
        />
        <UButton
          label="Reject"
          color="error"
          icon="hugeicons:cancel-circle"
          @click="confirmAction = 'reject'"
        />
        <UButton
          v-if="canDelete"
          label="Delete"
          color="error"
          variant="soft"
          icon="hugeicons:delete-02"
          @click="confirmAction = 'delete'"
        />
      </div>
      <UButton
        v-else-if="mode === 'create'"
        label="Submit Colorway"
        color="primary"
        :loading="uploading"
        @click="onSubmit"
      />
    </div>

    <UModal
      v-if="mode === 'review'"
      v-model:open="confirmVisible"
      :title="
        confirmAction === 'reject' ? 'Reject Submission' : 'Delete Submission'
      "
      :description="`Are you sure you want to ${confirmAction} ${colorways[0]?.name || 'this submission'}?`"
    >
      <template #footer="{ close }">
        <UButton label="Cancel" @click="close" />
        <UButton
          :label="confirmAction === 'reject' ? 'Reject' : 'Delete'"
          color="error"
          :loading="savingAction === confirmAction"
          @click="onConfirmAction(close)"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup>
const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'review'].includes(value),
  },
  submission: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['onSuccess', 'onDelete'])
const toast = useToast()
const userStore = useUserStore()

const stepper = useTemplateRef('stepper')
const active = ref(0)

const sculptModeTabs = [
  { label: 'Choose Existing Sculpt', value: 'existing' },
  { label: 'Propose New Sculpt', value: 'new' },
]

const {
  maker,
  makerOptions,
  makersStatus,
  sculptMode,
  existingSculpt,
  sculptOptions,
  sculptsStatus,
  sculpts,
  sculpt,
  colorways,
  addColorway,
  removeColorway,
  sculptReviewStatus,
  canDelete,
  load,
  save,
  moderate,
  remove,
  uploading,
  canAdvance,
  validateStep,
  submit,
} = useArtisanSubmissionWizard({
  mode: props.mode,
  submission: props.submission,
})

const selectedMakerLabel = computed(
  () => makerOptions.value.find((o) => o.value === maker.value.id)?.label,
)

const selectedSculptLabel = computed(
  () =>
    sculptOptions.value.find((o) => o.value === existingSculpt.value.id)?.label,
)

const selectedSculptContextLabel = computed(() =>
  sculptMode.value === 'new' ? sculpt.value.name : selectedSculptLabel.value,
)

const items = computed(() => [
  {
    slot: 'maker',
    title: 'Maker',
    description: selectedMakerLabel.value,
    icon: 'hugeicons:user-multiple',
  },
  {
    slot: 'sculpt',
    title: 'Sculpt',
    icon: 'hugeicons:dashboard-square-02',
    description: selectedSculptContextLabel.value,
  },
  {
    slot: 'colorway',
    title: 'Colorway',
    icon: 'hugeicons:paint-board',
  },
])

onMounted(async () => {
  if (props.mode === 'review') {
    await load()
    active.value = 1
    return
  }

  if (maker.value.id && existingSculpt.value.id) {
    active.value = 2
  }
})

const onNext = () => {
  if (!validateStep(active.value)) return
  stepper.value?.next()
}

const savingAction = ref(null)
const confirmAction = ref(null)
const confirmVisible = computed({
  get: () => !!confirmAction.value,
  set: (value) => {
    if (!value) confirmAction.value = null
  },
})

const onReviewAction = async (action) => {
  if (action !== 'update' && !userStore.isModerator) return
  if (!validateStep(2)) return

  savingAction.value = action

  try {
    if (action === 'update') {
      await save()
    } else {
      await moderate(action)
    }

    toast.add(handleSuccess('save', colorways.value[0]?.name, 'Colorway'))
    emit('onSuccess')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    savingAction.value = null
  }
}

const onConfirmAction = async (close) => {
  if (!userStore.isModerator || !confirmAction.value) return

  const action = confirmAction.value
  savingAction.value = action

  try {
    if (action === 'reject') {
      await moderate('reject')
      toast.add(handleSuccess('save', colorways.value[0]?.name, 'Colorway'))
      emit('onSuccess')
    } else {
      await remove()
      toast.add(handleSuccess('delete', colorways.value[0]?.name))
      emit('onDelete')
    }

    confirmAction.value = null
    close()
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    savingAction.value = null
  }
}

const onSubmit = async () => {
  if (!validateStep(2)) return

  try {
    await submit()
    emit('onSuccess')
  } catch {
    // toasted inside the composable
  }
}
</script>
