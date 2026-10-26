<template>
  <div class="space-y-6">
    <UStepper
      ref="stepper"
      v-model="wizard.active"
      :items="items"
      disabled
      class="w-full"
    >
      <template #profile>
        <SharedSubmissionEntityStep
          v-model:selected="profile.id"
          v-model:entity-mode="ownerMode"
          label="Profile"
          reviewed="kit"
          :mode="mode"
          hint="Pick the manufacturer profile this keyset belongs to, or propose one Keebdex doesn't list yet."
          :tabs="ownerOptions.length > 0"
          :options="ownerOptions"
          :loading="ownerStatus === 'pending'"
          :under-review="!!ownerReviewStatus"
          :name="profileLabel || manufacturers[profile.id]"
          :to="`/keyset/${profile.id}`"
        >
          <KeysetModalProfileForm
            v-model="profileDraft"
            mode="embedded"
            :is-edit="mode === 'review'"
          />
        </SharedSubmissionEntityStep>
      </template>

      <template #keyset>
        <SharedSubmissionEntityStep
          v-model:entity-mode="keysetMode"
          label="Keyset"
          reviewed="kit"
          :mode="mode"
          :tabs="!ownerIsNew"
          :under-review="keysetUnderReview"
          :name="keyset.name"
          :to="`/keyset/${existingKeyset.id}`"
        >
          <!-- Keysets are searched as you type, not preloaded -->
          <template #select>
            <USelectMenu
              v-model="existingKeyset.id"
              v-model:search-term="keysetTerm"
              :items="keysetOptions"
              :loading="keysetsStatus === 'pending'"
              value-key="value"
              label-key="label"
              ignore-filter
              placeholder="Select a keyset"
              :search-input="{
                placeholder: 'Type at least 3 characters to search...',
              }"
              class="w-full"
            />
          </template>

          <KeysetModalKeysetForm
            v-model="keyset"
            v-model:date-range="dateRange"
            :is-edit="mode === 'review'"
            :colors="mode === 'create'"
            mode="embedded"
            @update:uploading="wizard.setImageUploading('keyset', $event)"
          />
        </SharedSubmissionEntityStep>
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

          <SharedSubmissionItemList
            :items="kits"
            entity="Kit"
            :editable="mode === 'create'"
            :status="reviewStatus"
            @add="addKit"
            @remove="removeKit"
          >
            <template #default="{ item, index }">
              <KeysetModalKeysetKitForm
                v-model="kits[index]"
                mode="embedded"
                @update:uploading="
                  wizard.setImageUploading(`kit-${item._key}`, $event)
                "
              />
            </template>
          </SharedSubmissionItemList>
        </div>
      </template>
    </UStepper>

    <SharedSubmissionWizardFooter :wizard="wizard" submit-label="Submit Kits" />
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

const submissionWizard = useKeysetSubmissionWizard({
  mode: props.mode,
  submission: props.submission,
})

const {
  profile,
  owner,
  manufacturers,
  keysetMode,
  existingKeyset,
  keysetOptions,
  keysetsStatus,
  keysetTerm,
  selectedKeyset,
  keyset,
  dateRange,
  kits,
  addKit,
  removeKit,
  reviewStatus,
  keysetUnderReview,
} = submissionWizard

const {
  ownerMode,
  isNew: ownerIsNew,
  draft: profileDraft,
  options: ownerOptions,
  status: ownerStatus,
  reviewStatus: ownerReviewStatus,
  optionLabel: profileLabel,
} = owner

const kitLabel = () =>
  [keyset.value.name, kits.value[0]?.name || kits.value[0]?.kit_id]
    .filter(Boolean)
    .join(' - ')

const wizard = useSubmissionWizardActions({
  mode: props.mode,
  entity: 'Kit',
  label: kitLabel,
  stepCount: 3,
  // A profile or keyset under review is reviewed first; otherwise land on the
  // kit itself.
  reviewStep: () =>
    ownerReviewStatus.value ? 0 : keysetUnderReview.value ? 1 : 2,
  createStep: () => (profile.value.id && existingKeyset.value.id ? 2 : 0),
  wizard: submissionWizard,
  emit,
})

const items = computed(() => [
  {
    slot: 'profile',
    title: 'Profile',
    description: profileLabel.value || manufacturers.value[profile.value.id],
    icon: 'hugeicons:grid-view',
  },
  {
    slot: 'keyset',
    title: 'Keyset',
    icon: 'hugeicons:keyboard',
    description:
      props.mode === 'review' || keysetMode.value === 'new'
        ? keyset.value.name
        : selectedKeyset.value?.label,
  },
  {
    slot: 'kit',
    title: 'Kit',
    icon: 'hugeicons:package',
  },
])
</script>
