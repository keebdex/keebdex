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
            @update:uploading="wizard.setImageUploading('keyset', $event)"
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

const { groupedProfiles, manufacturers } = useKeysetProfiles()

const keysetModeTabs = [
  { label: 'Choose Existing Keyset', value: 'existing' },
  { label: 'Propose New Keyset', value: 'new' },
]

const submissionWizard = useKeysetSubmissionWizard({
  mode: props.mode,
  submission: props.submission,
})

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
} = submissionWizard

const kitLabel = () =>
  [keyset.value.name, kits.value[0]?.name || kits.value[0]?.kit_id]
    .filter(Boolean)
    .join(' - ')

const wizard = useSubmissionWizardActions({
  mode: props.mode,
  entity: 'Kit',
  label: kitLabel,
  stepCount: 3,
  // A published keyset isn't under review, so land on the kit itself.
  reviewStep: () => (keysetUnderReview.value ? 1 : 2),
  createStep: () => (profile.value.id && existingKeyset.value.id ? 2 : 0),
  wizard: submissionWizard,
  emit,
})

const selectedKeysetLabel = computed(
  () =>
    keysetOptions.value.find((o) => o.value === existingKeyset.value.id)?.label,
)

const items = computed(() => [
  {
    slot: 'profile',
    title: 'Profile',
    description: manufacturers.value[profile.value.id],
    icon: 'hugeicons:grid-view',
  },
  {
    slot: 'keyset',
    title: 'Keyset',
    icon: 'hugeicons:keyboard',
    description:
      props.mode === 'review' || keysetMode.value === 'new'
        ? keyset.value.name
        : selectedKeysetLabel.value,
  },
  {
    slot: 'kit',
    title: 'Kit',
    icon: 'hugeicons:package',
  },
])
</script>
