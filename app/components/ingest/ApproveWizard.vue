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
              is already on Keebdex. The form starts from what it has, with the
              thread's values in its empty fields; any change you make
              overwrites Keebdex.
            </p>

            <UTable
              v-if="wizard.differences.value.length"
              :data="wizard.differences.value"
              :columns="differenceColumns"
              :ui="{ root: 'rounded-md border border-default', th: 'py-2' }"
              class="min-w-0 max-w-full"
            >
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
                  :field="row.original.field"
                  :value="row.original.forum"
                />
              </template>
            </UTable>
          </template>

          <KeysetModalKeysetForm
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
                  :images="wizard.coverImages"
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
            Kits read from the thread: edit them, pick each kit's image from the
            thread's images, remove the ones it does not sell, or add any the
            extractor missed.
            <template v-if="wizard.matched">
              Keebdex's other kits stay as they are.
            </template>
          </p>

          <SharedSubmissionItemList
            :items="wizard.kits.value"
            entity="Kit"
            editable
            :min-items="wizard.matched ? 0 : 1"
            @add="wizard.addKit"
            @remove="wizard.removeKit"
          >
            <template #default="{ item, index }">
              <UAlert
                v-if="wizard.isListed(item)"
                color="info"
                variant="subtle"
                icon="solar:info-circle-line-duotone"
                title="Already Listed"
                description="Keebdex lists this kit: approving updates it with these values."
              />

              <KeysetModalKeysetKitForm
                v-model="wizard.kits.value[index]"
                mode="embedded"
              >
                <template #image="{ model }">
                  <UFormField
                    label="Image"
                    name="img"
                    help="This kit's image, from the images of the thread."
                  >
                    <IngestImagePicker
                      v-model="model.img"
                      :images="wizard.kitImages(model)"
                      :selected-label="kitLabel(model)"
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
const { kits: kitCategories } = useKeysetKits()

// The badge on a kit's picked image: its own name, else its category's.
const kitLabel = (kit: Record<string, any>) =>
  kit.name ||
  kitCategories.value.find((category) => category.slug === kit.kit_id)?.name ||
  'Kit'

const wizard = useIngestApproveWizard(props.candidate)

const lowConfidence = computed(() =>
  lowConfidenceFields(props.candidate).map(suggestionFieldLabel),
)

// The fields where the thread says something else than Keebdex.
const differenceColumns = [
  { id: 'field', header: 'Field' },
  { id: 'current', header: 'Keebdex' },
  { id: 'forum', header: 'Thread' },
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
