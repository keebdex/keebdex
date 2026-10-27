import {
  colorwayGdocManagedFields,
  sculptGdocManagedFields,
} from '~/utils/schemas/artisan'
import {
  PAGE_ENTITY_TYPES,
  SUGGESTION_ENTITIES,
  isProtectedSuggestionField,
  sameSuggestionValue,
} from '~/utils/suggestions'
import { userAvatar } from '~/utils'
import type { SuggestionEntityType } from '~/utils/suggestions'
import type { KeebModule } from '~/utils/keeb-modules'

/**
 * Revision history: every change to a maker, sculpt, colorway, profile,
 * keyset (its colors included), kit, brand, keyboard, release, or variant is
 * kept in `record_revisions` (see the `record_revisions` and
 * `catalog_parent_revisions` migrations). Staff read it from the History
 * slideover of each page and can undo an edit or restore a record to a
 * revision. Field labels and values reuse the edit suggestion helpers
 * (`app/utils/suggestions.ts`).
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
  domain: KeebModule
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
  suggested_by: {
    id: string
    name: string | null
    avatar?: string | null
  } | null
  reverts_revision: number | null
  run_id: string | null
  // The record's own name at that revision (variants: `variant_name`).
  record_name?: string | null
  variant_name?: string | null
  // Recent Changes only: the sculpt, keyset or keyboard page's name.
  parent_name?: string | null
}

export interface RevisionColor {
  id: number
  system: string
  code: string
  name: string | null
  hex: string
}

/** A color as keysets list it (`GMK N9`), or its id until it is loaded. */
export const keysetColorLabel = (color: Partial<RevisionColor> & { id: number }) =>
  color.system ? `${color.system} ${color.code}` : `Color ${color.id}`

export interface RevisionDetail extends Revision {
  snapshot: Record<string, unknown>
  before: Record<string, unknown> | null
  current: Record<string, unknown> | null
}

// Jobs and tools that write without a signed-in user, named like bot
// accounts (shown with a `bot` badge, as GitHub does); the SQL editor is
// a person working in the database, so it gets no badge.
const SOURCE_LABELS: Partial<Record<RevisionSource, string>> = {
  gdoc: 'Google Docs',
  scraper: 'Maker Sites',
  vendor: 'Vendor Sites',
  'image-sync': 'Image Sync',
  maintenance: 'Maintenance',
  sql: 'Database',
}

const BOT_SOURCES: RevisionSource[] = [
  'gdoc',
  'scraper',
  'vendor',
  'image-sync',
  'maintenance',
]

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

export interface RevisionAuthor {
  key: string
  name: string
  avatar: { src?: string; alt?: string; icon?: string; referrerpolicy?: string }
  bot: boolean
}

const person = (
  id: string | null,
  name: string | null,
  avatar?: string | null,
  fallback = 'Unknown user',
): RevisionAuthor => ({
  key: `user:${id}`,
  name: name || fallback,
  avatar: avatar ? userAvatar(avatar, name) : { icon: 'hugeicons:user' },
  bot: false,
})

/**
 * Who made a revision, like the authors of a commit: the editor; for an
 * applied suggestion, its submitter and the moderator who approved it
 * (co-authors); or the sync job, as a bot.
 */
export const revisionAuthorsOf = (revision: Revision): RevisionAuthor[] => {
  if (revision.source === 'suggestion') {
    const submitter = revision.suggested_by

    return [
      person(
        submitter?.id ?? null,
        submitter?.name ?? null,
        submitter?.avatar,
        'A member',
      ),
      ...(revision.actor
        ? [person(revision.actor, revision.actor_name, revision.actor_avatar)]
        : []),
    ]
  }

  if (revision.source === 'app' || revision.source === 'revert') {
    return [person(revision.actor, revision.actor_name, revision.actor_avatar)]
  }

  return [
    {
      key: `source:${revision.source}`,
      name: SOURCE_LABELS[revision.source] || revision.source,
      avatar: { icon: revisionIcon(revision) },
      bot: BOT_SOURCES.includes(revision.source),
    },
  ]
}

/** Everyone who made a group of revisions, each once, newest first. */
export const revisionAuthorList = (revisions: Revision[]) => {
  const authors = new Map<string, RevisionAuthor>()

  for (const author of revisions.flatMap(revisionAuthorsOf)) {
    if (!authors.has(author.key)) authors.set(author.key, author)
  }

  return [...authors.values()]
}

/** Authors as plain text: `Someone and Bui Anh Thang`, `Google Docs`. */
export const revisionAuthor = (revision: Revision) =>
  revisionAuthorsOf(revision)
    .map((author) => author.name)
    .join(' and ')

/** What a revision did, after its authors: `edited`, `reverted`. */
export const revisionVerb = (revision: Revision) =>
  revision.source === 'revert'
    ? 'reverted'
    : REVISION_ACTION_LABELS[revision.action].toLowerCase()

/** Whether the revision is of a page itself (maker, sculpt, keyset, ...). */
export const isPageRevision = (revision: Pick<Revision, 'entity_type'>) =>
  PAGE_ENTITY_TYPES.includes(revision.entity_type)

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
 * (which pages by these groups): Recent Changes by page, History one
 * revision at a time.
 */
export type RevisionGrouping = 'page' | 'revision'

export const revisionGroupKey = (
  revision: Pick<Revision, 'id' | 'domain' | 'parent_key'>,
  grouping: RevisionGrouping,
) =>
  grouping === 'page'
    ? `page:${revision.domain}:${revision.parent_key}`
    : `rev:${revision.id}`

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

/**
 * Detail page of a revision's page: a maker, profile, or brand is keyed by
 * its own key, a sculpt, keyset, or keyboard by its page key, under the same
 * routes.
 */
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
  domain: KeebModule
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
