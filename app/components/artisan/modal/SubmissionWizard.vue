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
                :maker-id="maker.id"
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
  reviewStatus,
  sculptReviewStatus,
} = submissionWizard

const wizard = useSubmissionWizardActions({
  mode: props.mode,
  entity: 'Colorway',
  label: () => colorways.value[0]?.name,
  stepCount: 3,
  // A sculpt proposed with the colorway is reviewed first.
  reviewStep: () => (sculptReviewStatus.value ? 1 : 2),
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
    description: makerOptions.value.find((o) => o.value === maker.value.id)
      ?.label,
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
