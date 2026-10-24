import type { Enums } from '~/types/database.types'

/**
 * Keebdex's catalog modules, from the database's `module` enum. Submissions,
 * edit suggestions and revisions store one as `domain`, image uploads as
 * `category`, and the search palette takes it as `module`.
 */
export type KeebModule = Lowercase<Enums<'module'>>

/** In sidebar order. */
export const KEEB_MODULES: readonly KeebModule[] = [
  'artisan',
  'keyboard',
  'keyset',
]

export const isKeebModule = (value: unknown): value is KeebModule =>
  KEEB_MODULES.includes(value as KeebModule)

export const KEEB_MODULE_LABELS: Record<KeebModule, Enums<'module'>> = {
  artisan: 'Artisan',
  keyboard: 'Keyboard',
  keyset: 'Keyset',
}

export const KEEB_MODULE_ICONS: Record<KeebModule, string> = {
  artisan: 'hugeicons:alien-01',
  keyboard: 'hugeicons:keyboard',
  keyset: 'hugeicons:grid-view',
}
