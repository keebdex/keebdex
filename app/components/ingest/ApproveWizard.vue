<template>
  <div class="space-y-6">
    <UStepper
      v-model="wizard.active.value"
      :items="items"
      disabled
      class="w-full"
    >
      <template #profile>
        <div class="space-y-4">
          <UAlert
            v-if="!candidate.payload.keyset.profile_id"
            color="warning"
            variant="subtle"
            icon="solar:danger-triangle-line-duotone"
            title="Profile Not Matched"
            description="The extractor could not match the thread title to a Keebdex profile. Pick it from the thread."
          />

          <UFormField label="Profile" name="profile_id" required>
            <USelect
              v-model="wizard.profileId.value"
              :items="groupedProfileItems(groupedProfiles)"
              placeholder="Select a profile"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>

      <template #keyset>
        <div class="space-y-4">
          <UAlert
            v-if="lowConfidence.length"
            color="warning"
            variant="subtle"
            icon="solar:danger-triangle-line-duotone"
            title="Check These Fields"
            :description="`The extractor is not sure of: ${lowConfidence.join(', ')}.`"
          />

          <template v-if="wizard.matched">
            <p class="text-sm text-muted">
              <ULink
                :to="`/keyset/${candidate.match_key}`"
                class="text-primary"
              >
                {{ candidate.match_key }}
              </ULink>
              is already on Keebdex. Pick the empty fields to fill from the
              thread; fields it has stay as they are.
            </p>

            <UTable
              :data="wizard.fillRows.value"
              :columns="fillColumns"
              :ui="{ root: 'rounded-md border border-default', th: 'py-2' }"
              class="min-w-0 max-w-full"
            >
              <template #pick-cell="{ row }">
                <UCheckbox
                  v-if="row.original.fillable"
                  v-model="wizard.pickedFields.value[row.original.field]"
                  :aria-label="`Fill ${suggestionFieldLabel(row.original.field)}`"
                />
              </template>

              <template #field-cell="{ row }">
                <span class="font-medium">
                  {{ suggestionFieldLabel(row.original.field) }}
                </span>
              </template>

              <template #current-cell="{ row }">
                <IngestFieldValue
                  :field="row.original.field"
                  :value="row.original.current"
                />
              </template>

              <template #forum-cell="{ row }">
                <IngestFieldValue
                  v-if="row.original.fillable"
                  :field="row.original.field"
                  :value="row.original.forum"
                />
                <UBadge v-else label="Keep" variant="subtle" />
              </template>

              <template #empty>
                <span class="text-muted">
                  Keebdex has every field the thread adds.
                </span>
              </template>
            </UTable>

            <UFormField
              v-if="wizard.needsCover"
              label="Image"
              help="Keebdex has no image for this keyset yet."
              required
            >
              <IngestImagePicker
                v-model="wizard.fillValues.value.img"
                :images="candidate.thread.images"
                selected-label="Cover"
              />
            </UFormField>
          </template>

          <KeysetModalKeysetForm
            v-else
            v-model="wizard.keyset.value"
            v-model:date-range="wizard.dateRange.value"
            mode="embedded"
          >
            <template #image="{ model }">
              <UFormField
                label="Image"
                name="img"
                help="The keyset's cover, from the images of the thread."
                required
              >
                <IngestImagePicker
                  v-model="model.img"
                  :images="candidate.thread.images"
                  selected-label="Cover"
                />
              </UFormField>
            </template>
          </KeysetModalKeysetForm>
        </div>
      </template>

      <template #kits>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{
              wizard.matched
                ? 'Kits Keebdex does not list yet. Remove the ones the thread does not sell, or add any the extractor missed.'
                : 'Kits read from the thread. Remove the ones it does not sell, or add any the extractor missed.'
            }}
          </p>

          <SharedSubmissionItemList
            :items="wizard.kits.value"
            entity="Kit"
            editable
            :min-items="wizard.matched ? 0 : 1"
            @add="wizard.addKit"
            @remove="wizard.removeKit"
          >
            <template #default="{ index }">
              <KeysetModalKeysetKitForm
                v-model="wizard.kits.value[index]"
                mode="embedded"
              >
                <template #image="{ model }">
                  <UFormField label="Image" name="img">
                    <IngestImagePicker
                      v-model="model.img"
                      :images="candidate.thread.images"
                      selected-label="Kit"
                      collapsible
                    />
                  </UFormField>
                </template>
              </KeysetModalKeysetKitForm>
            </template>
          </SharedSubmissionItemList>
        </div>
      </template>

      <template #review>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Approving writes exactly these rows. Go back to change anything.
          </p>

          <IngestInsertPreview
            v-for="section in wizard.sections.value"
            :key="section.statement + section.title"
            :section="section"
          />
        </div>
      </template>
    </UStepper>

    <div class="flex items-center justify-between gap-2">
      <UButton
        v-if="wizard.active.value > 0"
        label="Back"
        icon="solar:alt-arrow-left-linear"
        :ui="{ label: 'block' }"
        @click="wizard.back"
      />
      <UButton v-else label="Cancel" @click="emit('cancel')" />

      <UButton
        v-if="wizard.isLast.value"
        label="Approve"
        color="success"
        icon="solar:check-circle-line-duotone"
        :ui="{ label: 'block' }"
        @click="emit('approve', wizard.payload())"
      />
      <UButton
        v-else
        label="Next"
        trailing-icon="solar:alt-arrow-right-linear"
        color="primary"
        variant="solid"
        :ui="{ label: 'block' }"
        @click="wizard.next"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CandidatePayload, IngestCandidate } from '~/utils/ingest'

// Approve wizard of the Forum Review page: Profile (new keysets), Keyset,
// Kits, and Review, which lists what approving writes. Images are picked
// from the thread's own (`thread.images`); see useIngestApproveWizard.
const props = defineProps<{ candidate: IngestCandidate }>()

const emit = defineEmits<{ approve: [payload: CandidatePayload]; cancel: [] }>()

const { groupedProfiles, manufacturers } = useKeysetProfiles()

const wizard = useIngestApproveWizard(props.candidate)

const lowConfidence = computed(() =>
  lowConfidenceFields(props.candidate).map(suggestionFieldLabel),
)

const fillColumns = [
  { id: 'pick' },
  { id: 'field', header: 'Field' },
  { id: 'current', header: 'Keebdex' },
  { id: 'forum', header: 'Forum' },
]

const STEP_ITEMS: Record<string, { title: string; icon: string }> = {
  profile: { title: 'Profile', icon: 'solar:widget-line-duotone' },
  keyset: { title: 'Keyset', icon: 'solar:keyboard-line-duotone' },
  kits: { title: 'Kits', icon: 'solar:box-line-duotone' },
  review: {
    title: 'Review',
    icon: 'solar:checklist-minimalistic-line-duotone',
  },
}

const items = computed(() =>
  wizard.steps.map((slot) => ({
    slot,
    ...STEP_ITEMS[slot]!,
    description:
      slot === 'profile'
        ? manufacturers.value[wizard.profileId.value]
        : slot === 'keyset'
          ? wizard.matched
            ? props.candidate.match_key!
            : wizard.keyset.value.name
          : slot === 'kits'
            ? countLabel(wizard.kits.value.length, 'kit')
            : undefined,
  })),
)
</script>
