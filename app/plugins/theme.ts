import { defu } from 'defu'
import { presetToCss } from '~/utils/theme-presets'

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value))
}

export default defineNuxtPlugin(() => {
  const appConfig = useAppConfig()
  const { preset } = useAppTheme()

  const baseline: Record<string, any> = clone(appConfig.ui || {})
  let touched: string[] = []

  function applyUi(ui: Record<string, any>) {
    for (const key of touched) {
      ;(appConfig.ui as any)[key] = clone(baseline[key])
    }

    ;(appConfig.ui as any).colors = {
      ...(baseline.colors || {}),
      ...(ui.colors || {}),
    }

    ;(appConfig.ui as any).icons = {
      ...(baseline.icons || {}),
      ...(ui.icons || {}),
    }

    touched = []

    for (const [key, value] of Object.entries(ui)) {
      if (key === 'colors' || key === 'icons') continue

      ;(appConfig.ui as any)[key] = defu(
        clone(value),
        clone(baseline[key]) || {},
      )

      touched.push(key)
    }
  }

  watch(
    preset,
    (next) => {
      applyUi(next.ui)
    },
    { immediate: true },
  )

  useHead(() => ({
    style: [
      {
        id: 'app-theme',
        innerHTML: presetToCss(preset.value),
      },
    ],
  }))
})
