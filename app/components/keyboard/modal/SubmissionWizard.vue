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
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Pick the brand this keyboard belongs to.
          </p>

          <USelectMenu
            v-model="brand.id"
            :items="brandOptions"
            :loading="brandsStatus === 'pending'"
            :disabled="mode === 'review'"
            value-key="value"
            label-key="label"
            placeholder="Select a brand"
            class="w-full"
          />
        </div>
      </template>

      <template #keyboard>
        <div v-if="mode === 'review' && !keyboardUnderReview" class="space-y-2">
          <p class="text-sm text-muted">
            This keyboard is already published. Only the variant is reviewed
            here.
          </p>

          <NuxtLink
            :to="`/keyboard/brand/${existingKeyboard.id}`"
            class="text-sm font-medium text-primary hover:underline"
          >
            {{ keyboard.name }}
          </NuxtLink>
        </div>

        <div v-else class="space-y-4">
          <p v-if="mode === 'review'" class="text-sm text-muted">
            This keyboard is still under review — review and edit it here before
            approving.
          </p>

          <UTabs
            v-if="mode === 'create' && keyboardOptions.length"
            v-model="keyboardMode"
            :items="keyboardModeTabs"
            size="sm"
          />

          <USelectMenu
            v-if="mode === 'create' && keyboardMode === 'existing'"
            v-model="existingKeyboard.id"
            :items="keyboardOptions"
            :loading="keyboardsStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a keyboard"
            class="w-full"
          />

          <KeyboardModalKeyboardForm
            v-if="mode === 'review' || keyboardMode === 'new'"
            v-model="keyboard"
            :is-edit="mode === 'review'"
            mode="embedded"
          />
        </div>
      </template>

      <template #release>
        <div v-if="mode === 'review'" class="space-y-4">
          <p v-if="!releaseUnderReview" class="text-sm">
            <strong>{{ release.name }}</strong>
            <span class="text-muted">
              is already published. Only the variant is reviewed here.
            </span>
          </p>

          <template v-else>
            <p class="text-sm text-muted">
              This release is still under review — review and edit it here
              before approving.
            </p>

            <KeyboardModalReleaseForm
              v-model="release"
              :keyboard="{ releases: [] }"
              mode="embedded"
            />
          </template>
        </div>

        <div v-else class="space-y-4">
          <UTabs
            v-if="
              keyboardMode === 'existing' &&
              releaseOptions.length &&
              !isDirectReleaseEntry
            "
            v-model="releaseMode"
            :items="releaseModeTabs"
            size="sm"
          />

          <USelectMenu
            v-if="releaseMode === 'existing'"
            v-model="existingRelease.id"
            :items="releaseOptions"
            :loading="releasesStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a release"
            class="w-full"
          />

          <KeyboardModalReleaseForm
            v-if="releaseMode === 'new'"
            v-model="release"
            :keyboard="{ releases: [] }"
            mode="embedded"
          />
        </div>
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

const keyboardModeTabs = [
  { label: 'Choose Existing Keyboard', value: 'existing' },
  { label: 'Propose New Keyboard', value: 'new' },
]

const releaseModeTabs = [
  { label: 'Choose Existing Release', value: 'existing' },
  { label: 'Propose New Release', value: 'new' },
]

const submissionWizard = useKeyboardSubmissionWizard({
  mode: props.mode,
  submission: props.submission,
})

const {
  brand,
  brandOptions,
  brandsStatus,
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
    keyboardUnderReview.value ? 1 : releaseUnderReview.value ? 2 : 3,
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
    description: optionLabel(brandOptions.value, brand.value.id),
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
