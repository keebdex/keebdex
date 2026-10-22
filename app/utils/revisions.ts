import {
  colorwayGdocManagedFields,
  sculptGdocManagedFields,
} from '~/utils/schemas/artisan'
import {
  SUGGESTION_ENTITIES,
  isProtectedSuggestionField,
  sameSuggestionValue,
} from '~/utils/suggestions'
import type { SuggestionEntityType } from '~/utils/suggestions'

/**
 * Revision history: every change to a sculpt, colorway, keyset, kit,
 * keyboard, release, or variant is kept in `record_revisions` (see the
 * `record_revisions` migration). Staff read it from the History slideover of
 * the sculpt, keyset, and keyboard pages and can undo an edit or restore a
 * record to a revision. Field labels and values reuse the edit suggestion
 * helpers (`app/utils/suggestions.ts`).
 */

export type RevisionSource =
  | 'app'
  | 'suggestion'
  | 'revert'
  | 'gdoc'
  | 'scraper'
  | 'vendor'
  | 'image-sync'
  | 'maintenance'
  | 'sql'

export type RevisionAction = 'insert' | 'update' | 'delete'

/** Filters of who made a change, for Recent Changes and its API. */
export const REVISION_SOURCE_GROUPS = {
  editors: ['app', 'revert'],
  suggestions: ['suggestion'],
  syncs: ['gdoc', 'scraper', 'vendor', 'image-sync', 'maintenance', 'sql'],
} satisfies Record<string, RevisionSource[]>

export type RevisionSourceGroup = keyof typeof REVISION_SOURCE_GROUPS

export const isRevisionSourceGroup = (
  value: unknown,
): value is RevisionSourceGroup =>
  typeof value === 'string' && value in REVISION_SOURCE_GROUPS

export interface Revision {
  id: number
  created_at: string
  entity_type: SuggestionEntityType
  entity_id: number
  domain: string
  scope: string | null
  parent_key: string | null
  label: string | null
  action: RevisionAction
  changes: Record<string, [unknown, unknown]> | null
  source: RevisionSource
  actor: string | null
  actor_name: string | null
  actor_avatar: string | null
  suggestion_id: number | null
  suggested_by: { id: string; name: string | null } | null
  reverts_revision: number | null
  run_id: string | null
  // The record's own name at that revision (variants: `variant_name`).
  record_name?: string | null
  variant_name?: string | null
  // Recent Changes only: the sculpt, keyset or keyboard page's name.
  parent_name?: string | null
}

export interface RevisionDetail extends Revision {
  snapshot: Record<string, unknown>
  before: Record<string, unknown> | null
  current: Record<string, unknown> | null
}

// Jobs and tools that write without a signed-in user.
const SOURCE_LABELS: Partial<Record<RevisionSource, string>> = {
  gdoc: 'Google Doc sync',
  scraper: 'Maker website sync',
  vendor: 'Vendor import',
  'image-sync': 'Image sync',
  maintenance: 'Maintenance job',
  sql: 'Database',
}

const SOURCE_ICONS: Partial<Record<RevisionSource, string>> = {
  gdoc: 'hugeicons:google-doc',
  scraper: 'hugeicons:globe-02',
  vendor: 'hugeicons:store-01',
  'image-sync': 'hugeicons:image-upload',
  maintenance: 'hugeicons:wrench-01',
  sql: 'hugeicons:database',
  suggestion: 'hugeicons:pencil-edit-02',
  revert: 'hugeicons:undo-02',
}

const ACTION_ICONS: Record<RevisionAction, string> = {
  insert: 'hugeicons:file-add',
  update: 'hugeicons:file-edit',
  delete: 'hugeicons:file-remove',
}

export const REVISION_ACTION_LABELS: Record<RevisionAction, string> = {
  insert: 'Added',
  update: 'Edited',
  delete: 'Deleted',
}

export const revisionIcon = (revision: Revision) =>
  SOURCE_ICONS[revision.source] || ACTION_ICONS[revision.action]

/** Who or what made the change: an editor's name or a sync job. */
export const revisionAuthor = (revision: Revision) => {
  const name = revision.actor_name || (revision.actor ? 'Unknown user' : null)

  switch (revision.source) {
    case 'suggestion':
      return `Suggested by ${revision.suggested_by?.name || 'a member'}${
        name ? `, approved by ${name}` : ''
      }`
    case 'revert':
      return `Reverted by ${name || 'staff'}`
    case 'app':
      return name || 'Unknown user'
    default:
      return SOURCE_LABELS[revision.source] || revision.source
  }
}

// Records that are a page themselves rather than a child of one.
const PAGE_TYPES: SuggestionEntityType[] = [
  'artisan_sculpt',
  'keyset',
  'keyboard',
]

/** Whether the revision is of the page itself (sculpt, keyset, keyboard). */
export const isPageRevision = (revision: Pick<Revision, 'entity_type'>) =>
  PAGE_TYPES.includes(revision.entity_type)

/**
 * A record's name within its page, for lists that already show the page:
 * `Towers 60`, `International`, `Silver`, or `Keyset` for the page itself.
 * Kits named only by their category fall back to the label's last part
 * (`CYL Rainy Day R3 - Base` -> `Base`).
 */
export const revisionRecordName = (revision: Revision) => {
  if (isPageRevision(revision)) return revisionEntityLabel(revision)

  const own = revision.variant_name || revision.record_name
  if (own) return own

  const label = revision.label || ''
  const separator = label.lastIndexOf(' - ')

  return (
    (separator >= 0 ? label.slice(separator + 3) : label) ||
    revisionEntityLabel(revision)
  )
}

/** `Colorway`, `Kit`, `Keyboard`. */
export const revisionEntityLabel = (revision: Pick<Revision, 'entity_type'>) =>
  SUGGESTION_ENTITIES[revision.entity_type]?.label || 'Record'

/**
 * How lists group consecutive revisions, here and in `GET /api/revisions`
 * (which pages by these groups): Recent Changes by page, History by sync run
 * (other revisions stand alone).
 */
export type RevisionGrouping = 'page' | 'run'

export const revisionGroupKey = (
  revision: Pick<Revision, 'id' | 'domain' | 'parent_key' | 'run_id'>,
  grouping: RevisionGrouping,
) => {
  if (grouping === 'page')
    return `page:${revision.domain}:${revision.parent_key}`

  return revision.run_id ? `run:${revision.run_id}` : `rev:${revision.id}`
}

export type RevisionEntry =
  | { type: 'revision'; key: string; revision: Revision }
  | { type: 'run'; key: string; runId: string; revisions: Revision[] }

/**
 * Consecutive revisions of one sync run (same `run_id`) read as one entry,
 * opened to see each change.
 */
export const groupRevisions = (revisions: Revision[]): RevisionEntry[] => {
  const entries: RevisionEntry[] = []

  for (const revision of revisions) {
    const last = entries.at(-1)

    if (
      last?.type === 'run' &&
      revisionGroupKey(revision, 'run') === `run:${last.runId}`
    ) {
      last.revisions.push(revision)
    } else if (revision.run_id) {
      entries.push({
        type: 'run',
        key: `run-${revision.id}`,
        runId: revision.run_id,
        revisions: [revision],
      })
    } else {
      entries.push({ type: 'revision', key: `rev-${revision.id}`, revision })
    }
  }

  // A run of one change reads as that change.
  return entries.map((entry) =>
    entry.type === 'run' && entry.revisions.length === 1
      ? { type: 'revision', key: entry.key, revision: entry.revisions[0]! }
      : entry,
  )
}

export interface RevisionFieldDiff {
  key: string
  before: unknown
  after: unknown
}

// Columns never worth showing in a diff.
const HIDDEN_FIELDS = ['fts', 'updated_at']

const differs = (a: unknown, b: unknown) => !sameSuggestionValue(a, b)

/** What the revision itself changed: every field for an insert or delete. */
export const revisionChangeDiff = (
  revision: RevisionDetail,
): RevisionFieldDiff[] => {
  if (revision.action === 'update') {
    return Object.entries(revision.changes || {}).map(
      ([key, [before, after]]) => ({
        key,
        before,
        after,
      }),
    )
  }

  const row = revision.snapshot

  return Object.keys(row)
    .filter((key) => !HIDDEN_FIELDS.includes(key) && differs(row[key], null))
    .map((key) => ({
      key,
      before: revision.action === 'insert' ? null : row[key],
      after: revision.action === 'insert' ? row[key] : null,
    }))
}

/** Fields where the record now differs from the revision's snapshot. */
export const revisionCurrentDiff = (
  revision: RevisionDetail,
): RevisionFieldDiff[] => {
  const current = revision.current

  if (!current) return []

  return Object.keys(revision.snapshot)
    .filter(
      (key) =>
        !HIDDEN_FIELDS.includes(key) &&
        key in current &&
        differs(revision.snapshot[key], current[key]),
    )
    .map((key) => ({
      key,
      before: current[key],
      after: revision.snapshot[key],
    }))
}

/**
 * Fields a revert writes, as `revert_revision()` decides them: never keys,
 * parent links, order, sync or moderation columns (the columns a suggestion
 * cannot change either).
 */
export const revertableFields = (
  revision: RevisionDetail,
  mode: 'undo' | 'restore',
) =>
  (mode === 'undo'
    ? revisionChangeDiff(revision)
    : revisionCurrentDiff(revision)
  ).filter(
    (diff) => !isProtectedSuggestionField(revision.entity_type, diff.key),
  )

/** Fields of an undo that changed again since the revision. */
export const undoConflicts = (revision: RevisionDetail) =>
  revertableFields(revision, 'undo')
    .filter((diff) => differs(revision.current?.[diff.key], diff.after))
    .map((diff) => diff.key)

/**
 * Sync-managed fields a revert locks against the Google Doc or maker website
 * sync (added to `overridden_fields`), so the warning can name them.
 */
export const syncLockedFields = (revision: RevisionDetail, keys: string[]) => {
  if (!['gdoc', 'scraper'].includes(String(revision.current?.source))) return []

  const managed =
    revision.entity_type === 'artisan_colorway'
      ? colorwayGdocManagedFields
      : revision.entity_type === 'artisan_sculpt'
        ? sculptGdocManagedFields
        : []

  return keys.filter((key) => managed.includes(key))
}

/** Detail page of a revision's sculpt, keyset or keyboard. */
export const revisionPagePath = (
  revision: Pick<Revision, 'domain' | 'parent_key'>,
) => {
  if (!revision.parent_key) return null

  switch (revision.domain) {
    case 'artisan':
      return `/artisan/maker/${revision.parent_key}`
    case 'keyset':
      return `/keyset/${revision.parent_key}`
    default:
      return `/keyboard/brand/${revision.parent_key}`
  }
}

export interface RecentChangesEntry {
  key: string
  // Its newest change, which places it in the timeline.
  date: string
  domain: string
  parentKey: string | null
  name: string
  revisions: Revision[]
}

/**
 * Recent Changes: consecutive changes to the same page (sculpt, keyset or
 * keyboard with its children) as one entry, the groups the API pages by.
 */
export const groupRecentChanges = (
  revisions: Revision[],
): RecentChangesEntry[] => {
  const entries: (RecentChangesEntry & { groupKey: string })[] = []

  for (const revision of revisions) {
    const groupKey = revisionGroupKey(revision, 'page')
    const last = entries.at(-1)

    if (last?.groupKey === groupKey) {
      last.revisions.push(revision)
    } else {
      entries.push({
        key: `entry-${revision.id}`,
        date: revision.created_at,
        groupKey,
        domain: revision.domain,
        parentKey: revision.parent_key,
        name:
          revision.parent_name ||
          revision.label ||
          revision.parent_key ||
          'Unknown page',
        revisions: [revision],
      })
    }
  }

  return entries
}

/** `International, Novelties and Base`; past three, `… and 4 more`. */
export const revisionNameList = (revisions: Revision[]) => {
  const names = [...new Set(revisions.map(revisionRecordName))]
  const shown =
    names.length > 3
      ? [...names.slice(0, 3), `${names.length - 3} more`]
      : names

  return shown.length > 1
    ? `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}`
    : shown[0] || ''
}

/** `Google Doc sync and Maker M`, `3 editors and sources`: who changed a page. */
export const revisionAuthors = (revisions: Revision[]) => {
  const authors = [
    ...new Set(
      revisions.map((revision) =>
        revision.source === 'app' || revision.source === 'revert'
          ? revision.actor_name || 'Unknown user'
          : revision.source === 'suggestion'
            ? 'an edit suggestion'
            : SOURCE_LABELS[revision.source] || revision.source,
      ),
    ),
  ]

  if (authors.length > 2) return `${authors.length} editors and sources`

  return authors.join(' and ')
}

/** The editor's avatar, or the sync job's icon, for `UAvatar`. */
export const revisionAvatar = (revision: Revision) =>
  revision.actor_avatar
    ? { src: revision.actor_avatar, alt: revision.actor_name || undefined }
    : { icon: revisionIcon(revision) }
