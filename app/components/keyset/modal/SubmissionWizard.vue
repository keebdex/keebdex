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
            placeholder="Select a profile"
            class="w-full"
          />
        </div>
      </template>

      <template #keyset>
        <div class="space-y-4">
          <UTabs
            v-if="keysetOptions.length"
            v-model="keysetMode"
            :items="keysetModeTabs"
            size="sm"
          />

          <USelectMenu
            v-if="keysetMode === 'existing'"
            v-model="existingKeyset.id"
            :items="keysetOptions"
            :loading="keysetsStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a keyset"
            class="w-full"
          />

          <KeysetModalKeysetForm
            v-else
            v-model="keyset"
            v-model:date-range="dateRange"
            mode="embedded"
          />
        </div>
      </template>

      <template #kit>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Add one or more kits for this keyset.
          </p>

          <div
            v-for="(kit, index) in kits"
            :key="kit._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-dimmed">
                Kit #{{ index + 1 }}
              </p>

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
        @click="onNext"
      />
      <UButton
        v-else
        label="Submit Kits"
        color="primary"
        :loading="uploading"
        @click="onSubmit"
      />
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['onSuccess'])

const { groupedProfiles } = useKeysetProfiles()

const stepper = useTemplateRef('stepper')
const active = ref(0)

const items = [
  { slot: 'profile', title: 'Profile', icon: 'hugeicons:grid-view' },
  { slot: 'keyset', title: 'Keyset', icon: 'hugeicons:keyboard' },
  { slot: 'kit', title: 'Kit', icon: 'hugeicons:package' },
]

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
  uploading,
  validateStep,
  submit,
} = useKeysetSubmissionWizard()

onMounted(() => {
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
</script>
