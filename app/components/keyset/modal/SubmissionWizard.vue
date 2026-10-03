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
        <div v-if="childrenOnly" class="space-y-2">
          <p class="text-sm text-muted">
            This keyset is already published. Only the kits proposed for it are
            reviewed here.
          </p>

          <NuxtLink
            :to="`/keyset/${existingKeyset.id}`"
            class="text-sm font-medium text-primary hover:underline"
          >
            {{ keyset.name }}
          </NuxtLink>
        </div>

        <div v-else class="space-y-4">
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
              childrenOnly
                ? 'Review and edit the kits proposed for this keyset.'
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
                  v-if="kit.review_status"
                  :label="kit.review_status"
                  variant="subtle"
                  size="xs"
                  :color="statusColorMap[kit.review_status] || 'neutral'"
                />
              </div>

              <UButton
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
        :disabled="!canAdvance[active]"
        @click="onNext"
      />

      <div
        v-else-if="mode === 'review'"
        class="flex flex-wrap items-center justify-end gap-2"
      >
        <UButton
          v-if="!userStore.isModerator"
          label="Save Changes"
          color="primary"
          :loading="savingAction === 'update'"
          @click="onReviewAction('update')"
        />

        <template v-if="userStore.isModerator">
          <UButton
            label="Save & Approve"
            color="success"
            icon="hugeicons:checkmark-circle-02"
            :loading="savingAction === 'approve'"
            @click="onReviewAction('approve')"
          />

          <UButton
            label="Reject"
            color="error"
            icon="hugeicons:cancel-circle"
            :loading="savingAction === 'reject'"
            @click="onReviewAction('reject')"
          />
        </template>

        <UButton
          v-if="canDelete"
          label="Delete"
          color="error"
          variant="soft"
          icon="hugeicons:delete-02"
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
      title="Delete Submission"
      :description="
        childrenOnly
          ? `Are you sure you want to delete the kits proposed for ${keyset.name}? The keyset itself is kept. This action cannot be undone.`
          : `Are you sure you want to delete ${keyset.name}? This action cannot be undone.`
      "
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
  submissionId: {
    type: [String, Number],
    default: null,
  },
  // Review only the kits proposed for an already-published keyset.
  childrenOnly: {
    type: Boolean,
    default: false,
  },
  // `profile_keyset_id` of that published keyset (required with childrenOnly).
  parentKey: {
    type: String,
    default: '',
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
  submissionId: props.submissionId,
  childrenOnly: props.childrenOnly,
  parentKey: props.parentKey,
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

onMounted(async () => {
  if (props.mode === 'review') {
    await load()
    // A published keyset isn't under review, so land on its proposed kits.
    active.value = props.childrenOnly ? 2 : 1
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

const validateAllSteps = () => {
  for (let i = 0; i < items.value.length; i++) {
    if (!validateStep(i)) return false
  }

  return true
}

const savingAction = ref(null)
const deleteVisible = ref(false)

const onReviewAction = async (action) => {
  if ((action === 'update' || action === 'approve') && !validateAllSteps()) {
    return
  }

  savingAction.value = action

  try {
    await save(action)
    toast.add(
      handleSuccess(
        'save',
        keyset.value.name,
        props.childrenOnly ? 'Kit' : 'Keyset',
      ),
    )
    emit('onSuccess')
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

    toast.add(handleSuccess('delete', keyset.value.name))
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
