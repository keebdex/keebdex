<template>
  <div class="space-y-6">
    <UStepper
      ref="stepper"
      v-model="active"
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
            v-if="sculptOptions.length"
            v-model="sculptMode"
            :items="sculptModeTabs"
            size="sm"
          />

          <USelectMenu
            v-if="sculptMode === 'existing'"
            v-model="existingSculpt.id"
            :items="sculptOptions"
            :loading="sculptsStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a sculpt"
            class="w-full"
          />

          <ArtisanModalSculptForm
            v-else
            v-model="sculpt"
            :sculpts="sculpts"
            mode="embedded"
          />
        </div>
      </template>

      <template #colorway>
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm text-muted">
              Add one or more colorways for this sculpt.
            </p>

            <UButton
              label="Add Colorway"
              size="xs"
              variant="soft"
              icon="hugeicons:plus-sign"
              @click="addColorway"
            />
          </div>

          <div
            v-for="(colorway, index) in colorways"
            :key="colorway._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-dimmed">
                Colorway #{{ index + 1 }}
              </p>

              <UButton
                aria-label="Remove colorway"
                size="xs"
                color="error"
                variant="ghost"
                icon="hugeicons:delete-02"
                :disabled="colorways.length === 1"
                @click="removeColorway(index)"
              />
            </div>

            <ArtisanModalColorwayForm
              v-model="colorways[index]"
              mode="embedded"
            />
          </div>
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
        label="Submit Colorway"
        color="primary"
        :loading="uploading"
        @click="onSubmit"
      />
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['onSuccess'])

const stepper = useTemplateRef('stepper')
const active = ref(0)

const items = [
  { slot: 'maker', title: 'Maker', icon: 'hugeicons:user-multiple' },
  { slot: 'sculpt', title: 'Sculpt', icon: 'hugeicons:dashboard-square-02' },
  { slot: 'colorway', title: 'Colorway', icon: 'hugeicons:paint-board' },
]

const sculptModeTabs = [
  { label: 'Choose Existing Sculpt', value: 'existing' },
  { label: 'Propose New Sculpt', value: 'new' },
]

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
  uploading,
  validateStep,
  submit,
} = useArtisanSubmissionWizard()

onMounted(() => {
  if (maker.value.id && existingSculpt.value.id) {
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
