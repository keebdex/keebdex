<template>
  <div class="space-y-6">
    <UStepper
      ref="stepper"
      v-model="wizard.active"
      :items="items"
      disabled
      class="w-full"
    >
      <template #brand>
        <SharedSubmissionEntityStep
          v-bind="ownerStep"
          v-model:selected="brand.id"
          v-model:entity-mode="ownerMode"
          reviewed="variant"
          :mode="mode"
          hint="Pick the brand this keyboard belongs to, or propose one Keebdex doesn't list yet."
          :to="`/keyboard/brand/${brand.id}`"
        >
          <KeyboardModalBrandForm v-model="brandDraft" mode="embedded" />
        </SharedSubmissionEntityStep>
      </template>

      <template #keyboard>
        <SharedSubmissionEntityStep
          v-model:selected="existingKeyboard.id"
          v-model:entity-mode="keyboardMode"
          label="Keyboard"
          reviewed="variant"
          :mode="mode"
          :tabs="keyboardOptions.length > 0"
          :options="keyboardOptions"
          :loading="keyboardsStatus === 'pending'"
          :under-review="keyboardUnderReview"
          :name="keyboard.name"
          :to="`/keyboard/brand/${existingKeyboard.id}`"
        >
          <KeyboardModalKeyboardForm
            v-model="keyboard"
            :is-edit="mode === 'review'"
            mode="embedded"
          />
        </SharedSubmissionEntityStep>
      </template>

      <template #release>
        <!-- A direct "Add Release" link proposes a new release -->
        <SharedSubmissionEntityStep
          v-model:selected="existingRelease.id"
          v-model:entity-mode="releaseMode"
          label="Release"
          reviewed="variant"
          :mode="mode"
          :tabs="
            keyboardMode === 'existing' &&
            releaseOptions.length > 0 &&
            !isDirectReleaseEntry
          "
          :options="releaseOptions"
          :loading="releasesStatus === 'pending'"
          :under-review="releaseUnderReview"
          :name="release.name"
        >
          <KeyboardModalReleaseForm
            v-model="release"
            :keyboard="{ releases: [] }"
            mode="embedded"
          />
        </SharedSubmissionEntityStep>
      </template>

      <template #variant>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{
              mode === 'review'
                ? 'Review and edit this variant.'
                : 'Add one or more variants for this release.'
            }}
          </p>

          <SharedSubmissionItemList
            :items="variants"
            entity="Variant"
            :editable="mode === 'create'"
            :status="reviewStatus"
            @add="addVariant"
            @remove="removeVariant"
          >
            <template #default="{ item, index }">
              <KeyboardModalVariantForm
                v-model="variants[index]"
                :keyboard="keyboardForVariantForm"
                mode="embedded"
                @update:uploading="
                  wizard.setImageUploading(`variant-${item._key}`, $event)
                "
              />
            </template>
          </SharedSubmissionItemList>
        </div>
      </template>
    </UStepper>

    <SharedSubmissionWizardFooter
      :wizard="wizard"
      submit-label="Submit Variants"
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
  // In review mode: the variant row from GET /api/submissions/keyboard.
  submission: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['onSuccess', 'onDelete'])

const submissionWizard = useKeyboardSubmissionWizard({
  mode: props.mode,
  submission: props.submission,
})

const {
  brand,
  owner,
  keyboardMode,
  existingKeyboard,
  keyboardOptions,
  keyboardsStatus,
  keyboard,
  releaseMode,
  isDirectReleaseEntry,
  existingRelease,
  releaseOptions,
  releasesStatus,
  release,
  variants,
  addVariant,
  removeVariant,
  keyboardForVariantForm,
  reviewStatus,
  keyboardUnderReview,
  releaseUnderReview,
} = submissionWizard

const {
  ownerMode,
  draft: brandDraft,
  reviewStatus: ownerReviewStatus,
  optionLabel: brandLabel,
  stepProps: ownerStep,
} = owner

const wizard = useSubmissionWizardActions({
  mode: props.mode,
  entity: 'Variant',
  label: () =>
    [keyboard.value.name, release.value.name, variants.value[0]?.variant_name]
      .filter(Boolean)
      .join(' - '),
  stepCount: 4,
  // Land on the highest level that is still under review; a published
  // keyboard and release leave just the variant.
  reviewStep: () =>
    ownerReviewStatus.value
      ? 0
      : keyboardUnderReview.value
        ? 1
        : releaseUnderReview.value
          ? 2
          : 3,
  createStep: () =>
    !brand.value.id || !existingKeyboard.value.id
      ? 0
      : existingRelease.value.id
        ? 3
        : 2,
  wizard: submissionWizard,
  emit,
})

const optionLabel = (options, value) =>
  options.find((o) => o.value === value)?.label

const items = computed(() => [
  {
    slot: 'brand',
    title: 'Brand',
    description: brandLabel.value,
    icon: 'hugeicons:user-multiple',
  },
  {
    slot: 'keyboard',
    title: 'Keyboard',
    icon: 'hugeicons:keyboard',
    description:
      props.mode === 'review' || keyboardMode.value === 'new'
        ? keyboard.value.name
        : optionLabel(keyboardOptions.value, existingKeyboard.value.id),
  },
  {
    slot: 'release',
    title: 'Release',
    icon: 'hugeicons:package',
    description:
      props.mode === 'review' || releaseMode.value === 'new'
        ? release.value.name
        : optionLabel(releaseOptions.value, existingRelease.value.id),
  },
  {
    slot: 'variant',
    title: 'Variant',
    icon: 'hugeicons:layers-01',
  },
])
</script>
