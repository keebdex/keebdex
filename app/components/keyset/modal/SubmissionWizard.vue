<template>
  <div class="space-y-6">
    <UStepper
      ref="stepper"
      v-model="active"
      :items="items"
      disabled
      class="w-full"
    >
      <template #profile>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Pick the manufacturer profile this keyset belongs to.
          </p>

          <USelect
            v-model="profile.id"
            :items="
              Object.entries(groupedProfiles)
                .map(([label, profileManufacturers]) => [
                  { type: 'label', label },
                  ...Object.entries(profileManufacturers).map(
                    ([value, name]) => ({
                      type: 'item',
                      label: name,
                      value,
                    }),
                  ),
                  { type: 'separator' },
                ])
                .flat()
                .slice(0, -1)
            "
            :disabled="mode === 'review'"
            placeholder="Select a profile"
            class="w-full"
          />
        </div>
      </template>

      <template #keyset>
        <div v-if="mode === 'review' && !keysetUnderReview" class="space-y-2">
          <p class="text-sm text-muted">
            This keyset is already published. Only the kit is reviewed here.
          </p>

          <NuxtLink
            :to="`/keyset/${existingKeyset.id}`"
            class="text-sm font-medium text-primary hover:underline"
          >
            {{ keyset.name }}
          </NuxtLink>
        </div>

        <div v-else class="space-y-4">
          <p v-if="mode === 'review'" class="text-sm text-muted">
            This keyset is still under review — review and edit it here before
            approving.
          </p>

          <UTabs
            v-if="mode === 'create' && keysetOptions.length"
            v-model="keysetMode"
            :items="keysetModeTabs"
            size="sm"
          />

          <USelectMenu
            v-if="mode === 'create' && keysetMode === 'existing'"
            v-model="existingKeyset.id"
            :items="keysetOptions"
            :loading="keysetsStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a keyset"
            class="w-full"
          />

          <KeysetModalKeysetForm
            v-if="mode === 'review' || keysetMode === 'new'"
            v-model="keyset"
            v-model:date-range="dateRange"
            :is-edit="mode === 'review'"
            mode="embedded"
          />
        </div>
      </template>

      <template #kit>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{
              mode === 'review'
                ? 'Review and edit this kit.'
                : 'Add one or more kits for this keyset.'
            }}
          </p>

          <div
            v-for="(kit, index) in kits"
            :key="kit._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <p class="text-xs font-medium text-dimmed">
                  Kit #{{ index + 1 }}
                </p>

                <UBadge
                  v-if="mode === 'review' && reviewStatus"
                  :label="reviewStatus"
                  variant="subtle"
                  size="xs"
                  :color="statusColorMap[reviewStatus] || 'neutral'"
                />
              </div>

              <UButton
                v-if="mode === 'create'"
                aria-label="Remove kit"
                size="xs"
                color="error"
                variant="ghost"
                icon="hugeicons:delete-02"
                :disabled="kits.length === 1"
                @click="removeKit(index)"
              />
            </div>

            <KeysetModalKeysetKitForm v-model="kits[index]" mode="embedded" />
          </div>

          <UButton
            v-if="mode === 'create'"
            label="Add Kit"
            size="xs"
            variant="soft"
            icon="hugeicons:plus-sign"
            block
            @click="addKit"
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
        :disabled="!canAdvance[active] || (mode === 'review' && !reviewLoaded)"
        @click="onNext"
      />

      <div
        v-else-if="mode === 'review'"
        class="flex flex-wrap items-center justify-end gap-2"
      >
        <UButton
          v-if="canSave && !userStore.isModerator"
          label="Save Changes"
          color="primary"
          :loading="savingAction === 'update'"
          :disabled="!reviewLoaded || !!savingAction"
          @click="onReviewAction('update')"
        />

        <UButton
          v-if="userStore.isModerator"
          label="Save & Approve"
          color="success"
          icon="hugeicons:checkmark-circle-02"
          :loading="savingAction === 'approve'"
          :disabled="!reviewLoaded || !!savingAction"
          @click="onReviewAction('approve')"
        />

        <UButton
          v-if="canDelete"
          label="Delete"
          color="error"
          variant="soft"
          icon="hugeicons:delete-02"
          :disabled="!reviewLoaded || !!savingAction"
          @click="deleteVisible = true"
        />
      </div>

      <UButton
        v-else
        label="Submit Kits"
        color="primary"
        :loading="uploading"
        @click="onSubmit"
      />
    </div>

    <UModal
      v-if="mode === 'review'"
      v-model:open="deleteVisible"
      title="Delete Kit"
      :description="`Are you sure you want to delete ${kitLabel}? This action cannot be undone.`"
    >
      <template #footer="{ close }">
        <UButton label="Cancel" @click="close" />
        <UButton
          label="Delete"
          color="error"
          :loading="savingAction === 'delete'"
          @click="onDeleteConfirm(close)"
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
  // In review mode: the kit row from GET /api/submissions/keyset.
  submission: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['onSuccess', 'onDelete'])

const toast = useToast()
const userStore = useUserStore()
const { groupedProfiles, manufacturers } = useKeysetProfiles()

const stepper = useTemplateRef('stepper')
const active = ref(0)

const keysetModeTabs = [
  { label: 'Choose Existing Keyset', value: 'existing' },
  { label: 'Propose New Keyset', value: 'new' },
]

const {
  profile,
  keysetMode,
  existingKeyset,
  keysetOptions,
  keysetsStatus,
  keyset,
  dateRange,
  kits,
  addKit,
  removeKit,
  reviewStatus,
  keysetUnderReview,
  canSave,
  canDelete,
  load,
  save,
  remove,
  uploading,
  canAdvance,
  validateStep,
  submit,
} = useKeysetSubmissionWizard({
  mode: props.mode,
  submission: props.submission,
})

const selectedProfileLabel = computed(
  () => manufacturers.value[profile.value.id],
)

const selectedKeysetLabel = computed(
  () =>
    keysetOptions.value.find((o) => o.value === existingKeyset.value.id)?.label,
)

const selectedKeysetContextLabel = computed(() =>
  props.mode === 'review' || keysetMode.value === 'new'
    ? keyset.value.name
    : selectedKeysetLabel.value,
)

const items = computed(() => [
  {
    slot: 'profile',
    title: 'Profile',
    description: selectedProfileLabel.value,
    icon: 'hugeicons:grid-view',
  },
  {
    slot: 'keyset',
    title: 'Keyset',
    icon: 'hugeicons:keyboard',
    description: selectedKeysetContextLabel.value,
  },
  {
    slot: 'kit',
    title: 'Kit',
    icon: 'hugeicons:package',
  },
])

const kitLabel = computed(() =>
  [keyset.value.name, kits.value[0]?.name || kits.value[0]?.kit_id]
    .filter(Boolean)
    .join(' - '),
)

const reviewLoaded = ref(false)

onMounted(async () => {
  if (props.mode === 'review') {
    try {
      await load()
      // A published keyset isn't under review, so land on the kit itself.
      active.value = keysetUnderReview.value ? 1 : 2
      reviewLoaded.value = true
    } catch (error) {
      toast.add(handleError(error, { showOriginalMessage: true }))
    }
    return
  }

  if (profile.value.id && existingKeyset.value.id) {
    active.value = 2
  }
})

const onNext = () => {
  if (!validateStep(active.value)) return
  stepper.value?.next()
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

const savingAction = ref(null)
const deleteVisible = ref(false)

const onReviewAction = async (action) => {
  if (!reviewLoaded.value || savingAction.value) return
  if (!validateStep(1) || !validateStep(2)) return

  savingAction.value = action

  try {
    await save(action)

    toast.add(
      handleSuccess(
        action === 'approve' ? 'approve' : 'save',
        kitLabel.value,
        'Kit',
      ),
    )
    // A submitter's edit sends a rejected kit back to the Pending queue.
    emit('onSuccess', {
      resubmitted: !userStore.isModerator && reviewStatus.value === 'Rejected',
    })
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    savingAction.value = null
  }
}

const onDeleteConfirm = async (close) => {
  savingAction.value = 'delete'

  try {
    await remove()

    toast.add(handleSuccess('delete', kitLabel.value, 'Kit'))
    deleteVisible.value = false
    close()
    emit('onDelete')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    savingAction.value = null
  }
}
</script>
