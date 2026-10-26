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
        <SharedSubmissionEntityStep
          v-model:selected="maker.id"
          v-model:entity-mode="ownerMode"
          label="Maker"
          reviewed="colorway"
          :mode="mode"
          hint="Pick the maker this colorway belongs to, or propose one Keebdex doesn't list yet."
          :tabs="ownerOptions.length > 0"
          :options="ownerOptions"
          :loading="ownerStatus === 'pending'"
          :under-review="!!ownerReviewStatus"
          :name="makerLabel"
          :to="`/artisan/maker/${maker.id}`"
        >
          <ArtisanModalMakerForm
            v-model="makerDraft"
            mode="embedded"
            suggest
            :is-edit="mode === 'review'"
          />
        </SharedSubmissionEntityStep>
      </template>

      <template #sculpt>
        <SharedSubmissionEntityStep
          v-model:selected="existingSculpt.id"
          v-model:entity-mode="sculptMode"
          label="Sculpt"
          reviewed="colorway"
          :mode="mode"
          :tabs="sculptOptions.length > 0"
          :options="sculptOptions"
          :loading="sculptsStatus === 'pending'"
          :under-review="!!sculptReviewStatus"
          :name="selectedSculptLabel"
          :to="`/artisan/maker/${maker.id}/${existingSculpt.id}`"
        >
          <ArtisanModalSculptForm
            v-model="sculpt"
            :sculpts="sculpts"
            mode="embedded"
          />
        </SharedSubmissionEntityStep>
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
