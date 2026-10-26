<template>
  <div class="space-y-6">
    <UStepper
      ref="stepper"
      v-model="wizard.active"
      :items="items"
      disabled
      class="w-full"
    >
      <template #maker>
        <SharedSubmissionOwnerStep
          v-model:selected="maker"
          v-model:owner-mode="ownerMode"
          label="Maker"
          :options="ownerOptions"
          :loading="ownerStatus === 'pending'"
          :review-status="ownerReviewStatus"
          :mode="mode"
          hint="Pick the maker this colorway belongs to, or propose one Keebdex doesn't list yet."
        >
          <ArtisanModalMakerForm
            v-model="makerDraft"
            mode="embedded"
            suggest
            :is-edit="mode === 'review'"
          />
        </SharedSubmissionOwnerStep>
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
            v-if="mode === 'review' && sculptReviewStatus"
            class="text-sm text-muted"
          >
            This sculpt was proposed together with the colorway below and is
            still under review — review and edit it here before approving.
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
          <p v-if="mode === 'create'" class="text-sm text-muted">
            Add one or more colorways for this sculpt.
          </p>

          <SharedSubmissionItemList
            :items="colorways"
            entity="Colorway"
            :editable="mode === 'create'"
            :status="reviewStatus"
            @add="addColorway"
            @remove="removeColorway"
          >
            <template #default="{ item, index }">
              <ArtisanModalColorwayForm
                v-model="colorways[index]"
                :maker-id="makerKey"
                mode="embedded"
                @update:uploading="wizard.setImageUploading(item._key, $event)"
              />
            </template>
          </SharedSubmissionItemList>
        </div>
      </template>
    </UStepper>

    <SharedSubmissionWizardFooter
      :wizard="wizard"
      submit-label="Submit Colorways"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'review'].includes(value),
  },
  // In review mode: the colorway row from GET /api/submissions/artisan.
  submission: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['onSuccess', 'onDelete'])

const sculptModeTabs = [
  { label: 'Choose Existing Sculpt', value: 'existing' },
  { label: 'Propose New Sculpt', value: 'new' },
]

const submissionWizard = useArtisanSubmissionWizard({
  mode: props.mode,
  submission: props.submission,
})

const {
  maker,
  owner,
  makerKey,
  sculptMode,
  existingSculpt,
  sculptOptions,
  sculptsStatus,
  sculpts,
  sculpt,
  colorways,
  addColorway,
  removeColorway,
  reviewStatus,
  sculptReviewStatus,
} = submissionWizard

const {
  ownerMode,
  draft: makerDraft,
  options: ownerOptions,
  status: ownerStatus,
  reviewStatus: ownerReviewStatus,
  optionLabel: makerLabel,
} = owner

const wizard = useSubmissionWizardActions({
  mode: props.mode,
  entity: 'Colorway',
  label: () => colorways.value[0]?.name,
  stepCount: 3,
  // A maker or sculpt proposed with the colorway is reviewed first.
  reviewStep: () =>
    ownerReviewStatus.value ? 0 : sculptReviewStatus.value ? 1 : 2,
  createStep: () => (maker.value.id && existingSculpt.value.id ? 2 : 0),
  wizard: submissionWizard,
  emit,
})

const selectedSculptLabel = computed(
  () =>
    sculptOptions.value.find((o) => o.value === existingSculpt.value.id)?.label,
)

const items = computed(() => [
  {
    slot: 'maker',
    title: 'Maker',
    description: makerLabel.value,
    icon: 'hugeicons:user-multiple',
  },
  {
    slot: 'sculpt',
    title: 'Sculpt',
    icon: 'hugeicons:dashboard-square-02',
    description:
      sculptMode.value === 'new' ? sculpt.value.name : selectedSculptLabel.value,
  },
  {
    slot: 'colorway',
    title: 'Colorway',
    icon: 'hugeicons:paint-board',
  },
])
</script>
