<template>
  <div class="space-y-8">
    <UPageHeader
      title="Appearance"
      description="Choose how Keebdex looks. Changes apply immediately."
    />

    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-highlighted">Theme</h2>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <USelect
          v-model="colorMode.preference"
          :items="modeItems"
          value-key="value"
          class="w-full sm:w-56"
        />
        <p class="text-sm text-muted">
          {{ modeDescription }}
        </p>
      </div>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">Palette</h2>
        <p class="text-sm text-muted">
          Select a palette to apply it immediately.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <button
          v-for="preset in presets"
          :key="preset.id"
          type="button"
          class="group overflow-hidden rounded-lg border text-start transition-colors"
          :class="
            themeId === preset.id
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-default hover:border-primary/50'
          "
          @click="setTheme(preset.id)"
        >
          <div
            class="flex items-center justify-between border-b px-4 py-3"
            :style="{
              ...previewStyle(preset, previewMode),
              background: 'var(--preview-bg)',
              borderColor: 'var(--preview-border)',
            }"
          >
            <span
              class="flex items-center gap-2 font-semibold text-[var(--preview-text)]"
            >
              <UIcon :name="preset.icon" class="size-5" />
              {{ preset.label }}
            </span>
            <UBadge
              v-if="themeId === preset.id"
              label="Selected"
              color="primary"
            />
          </div>

          <div
            class="p-4"
            :style="{
              ...previewStyle(preset, previewMode),
              background: 'var(--preview-bg)',
            }"
          >
            <div
              class="border p-3"
              style="
                border-color: var(--preview-border);
                background: var(--preview-surface);
                border-radius: var(--preview-radius);
              "
            >
              <div class="mb-4 flex items-center gap-2">
                <span
                  class="h-2 w-16 rounded-full"
                  style="background: var(--preview-border)"
                />
                <span
                  class="h-2 w-10 rounded-full"
                  style="background: var(--preview-border)"
                />
              </div>
              <div class="grid grid-cols-[1fr_4rem] gap-3">
                <div
                  class="p-3"
                  style="
                    background: var(--preview-bg);
                    border: 1px solid var(--preview-border);
                    border-radius: var(--preview-radius);
                  "
                >
                  <div
                    class="mb-3 h-2 w-2/3 rounded-full"
                    style="background: var(--preview-primary)"
                  />
                  <div class="space-y-2">
                    <div
                      class="h-2 w-full rounded-full"
                      style="background: var(--preview-border)"
                    />
                    <div
                      class="h-2 w-4/5 rounded-full"
                      style="background: var(--preview-border)"
                    />
                  </div>
                </div>
                <div
                  style="
                    background: var(--preview-primary);
                    opacity: 0.85;
                    border-radius: var(--preview-radius);
                  "
                />
              </div>
            </div>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  resolvePresetToken,
  type ThemePreset,
} from '~/utils/theme-presets'

const colorMode = useColorMode()
const { themeId, presets, setTheme } = useAppTheme()

const modeItems = [
  { label: 'Sync with system', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

const modeDescription = computed(() => {
  if (colorMode.preference === 'system') {
    return 'Keebdex will follow your operating system preference.'
  }

  return `Keebdex will use ${colorMode.preference} mode.`
})

const previewMode = computed(() =>
  colorMode.value === 'dark' ? 'dark' : 'light',
)

function previewStyle(preset: ThemePreset, mode: 'light' | 'dark') {
  const token = (name: string) => resolvePresetToken(preset, mode, name)

  return {
    '--preview-bg': token('--ui-bg'),
    '--preview-surface': token('--ui-bg-elevated'),
    '--preview-border': token('--ui-border'),
    '--preview-primary': token('--ui-primary'),
    '--preview-text': token('--ui-text-highlighted'),
    '--preview-radius': preset.css.root?.['--ui-radius'] || 'var(--ui-radius)',
  }
}
</script>
