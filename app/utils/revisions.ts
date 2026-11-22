import {
  colorwayGdocManagedFields,
  sculptGdocManagedFields,
} from '~/utils/schemas/artisan'
import {
  PAGE_ENTITY_TYPES,
  SUGGESTION_ENTITIES,
  isProtectedSuggestionField,
  sameSuggestionValue,
  suggestionFieldLabel,
} from '~/utils/suggestions'
import { userAvatar } from '~/utils'
import { daysAgo, formatDate, startOfDay } from '~/utils/date'
import type { SuggestionEntityType } from '~/utils/suggestions'
import { KEEB_MODULE_ICONS } from '~/utils/keeb-modules'
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

/** Changes made in Keebdex itself. */
export type RevisionAppSource = 'app' | 'suggestion' | 'revert'

/**
 * A sync job, `<job>.<origin>` (`bowerbird.gdoc`, `bowerbird.keycat`,
 * `pelican.cloudflare-images`, `magpie.geekhack`), sent by the job in the
 * `x-keebdex-source` header; or the SQL editor (`sql`). The database accepts
 * any value of that shape, so a new job or site needs no change here.
 */
export type RevisionSyncSource = 'sql' | `${string}.${string}`

export type RevisionSource = RevisionAppSource | RevisionSyncSource

export type RevisionAction = 'insert' | 'update' | 'delete'

/** Filters of who made a change, for Recent Changes and its API. */
export const REVISION_SOURCE_GROUPS = [
  'editors',
  'suggestions',
  'syncs',
] as const

export type RevisionSourceGroup = (typeof REVISION_SOURCE_GROUPS)[number]

/** The sources of the editors and suggestions groups; syncs are the rest. */
export const APP_REVISION_SOURCES = {
  editors: ['app', 'revert'],
  suggestions: ['suggestion'],
} satisfies Record<Exclude<RevisionSourceGroup, 'syncs'>, RevisionAppSource[]>

export const isRevisionSourceGroup = (
  value: unknown,
): value is RevisionSourceGroup =>
  typeof value === 'string' &&
  (REVISION_SOURCE_GROUPS as readonly string[]).includes(value)

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
export const keysetColorLabel = (
  color: Partial<RevisionColor> & { id: number },
) => (color.system ? `${color.system} ${color.code}` : `Color ${color.id}`)

export interface RevisionDetail extends Revision {
  snapshot: Record<string, unknown>
  before: Record<string, unknown> | null
  current: Record<string, unknown> | null
}

// Sync jobs write without a signed-in user and are named like bot accounts
// (shown with a `bot` badge, as GitHub does) after the job of their source,
// `<job>.<origin>`, with the site or document they read on hover. Jobs and
// origins without a label here are named from their slug (`alpha-keycaps` ->
// `Alpha Keycaps`), and jobs without an icon fall back to the action's icon, so
// a new job or site shows without a change here. The SQL editor is a person
// working in the database, so it gets no badge.
const SYNC_JOBS: Record<
  string,
  { label: string; icon: string; origin?: (name: string) => string }
> = {
  // Every origin but gdoc is a maker's website, named by its maker_id.
  bowerbird: {
    label: 'Bowerbird',
    icon: 'solar:earth-line-duotone',
    origin: (name) => `${name} Website`,
  },
  pelican: { label: 'Pelican', icon: 'solar:gallery-send-line-duotone' },
  magpie: { label: 'Magpie', icon: 'solar:chat-round-line-duotone' },
}

const SYNC_ORIGIN_LABELS: Record<string, string> = {
  gdoc: 'Google Docs',
  'cloudflare-images': 'Image Sync',
  geekhack: 'Geekhack',
  novelkeys: 'NovelKeys',
  prototypist: 'ProtoTypist',
}

const SYNC_ORIGIN_ICONS: Record<string, string> = {
  gdoc: 'simple-icons:googledocs',
  novelkeys: 'solar:shop-line-duotone',
  prototypist: 'solar:shop-line-duotone',
}

const SOURCE_ICONS: Partial<Record<RevisionSource, string>> = {
  sql: 'solar:database-line-duotone',
  suggestion: 'solar:pen-2-line-duotone',
  revert: 'solar:undo-left-line-duotone',
}

/** A sync source's job and origin: `bowerbird.gdoc` -> bowerbird, gdoc. */
const syncJobOf = (source: RevisionSource) => {
  const [job, origin] = source.split('.')

  return origin ? { job: job!, origin } : null
}

const titleCase = (slug: string) =>
  slug.replace(
    /(^|-)([a-z0-9])/g,
    (_, dash, char) => `${dash ? ' ' : ''}${char.toUpperCase()}`,
  )

const sourceLabel = (source: RevisionSource) => {
  const sync = syncJobOf(source)

  if (!sync) return source === 'sql' ? 'Database' : source

  return (
    SYNC_ORIGIN_LABELS[sync.origin] ||
    (SYNC_JOBS[sync.job]?.origin ?? String)(titleCase(sync.origin))
  )
}

const sourceIcon = (source: RevisionSource) => {
  const sync = syncJobOf(source)

  return sync
    ? SYNC_ORIGIN_ICONS[sync.origin] || SYNC_JOBS[sync.job]?.icon
    : SOURCE_ICONS[source]
}

const ACTION_ICONS: Record<RevisionAction, string> = {
  insert: 'solar:file-add-line-duotone',
  update: 'solar:file-pen-line-duotone',
  delete: 'solar:file-remove-line-duotone',
}

export const REVISION_ACTION_LABELS: Record<RevisionAction, string> = {
  insert: 'Added',
  update: 'Edited',
  delete: 'Deleted',
}

export const revisionIcon = (revision: Revision) =>
  sourceIcon(revision.source) || ACTION_ICONS[revision.action]

export interface RevisionAuthor {
  key: string
  name: string
  avatar: { src?: string; alt?: string; icon?: string; referrerpolicy?: string }
  bot: boolean
  // Sync jobs: the site read and the source sent (`Google Docs (bowerbird.gdoc)`).
  title?: string
}

const person = (
  id: string | null,
  name: string | null,
  avatar?: string | null,
  fallback = 'Unknown user',
): RevisionAuthor => ({
  key: `user:${id}`,
  name: name || fallback,
  avatar: avatar
    ? userAvatar(avatar, name)
    : { icon: 'solar:user-line-duotone' },
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

  const sync = syncJobOf(revision.source)

  // A sync is named after its bot (`Bowerbird`), once however many sites it
  // read; hovering it names the site (`Google Docs (bowerbird.gdoc)`).
  return [
    {
      key: sync ? `bot:${sync.job}` : `source:${revision.source}`,
      name: sync
        ? SYNC_JOBS[sync.job]?.label || titleCase(sync.job)
        : sourceLabel(revision.source),
      avatar: { icon: revisionIcon(revision) },
      bot: !!sync,
      title: sync
        ? `${sourceLabel(revision.source)} (${revision.source})`
        : undefined,
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

/** Authors as plain text: `Someone and Bui Anh Thang`, `Bowerbird`. */
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

/**
 * Icons of the record kinds, for History rows: the sidebar's where it has
 * one (the module icons for sculpts, keysets and keyboards; Makers, Brands
 * and Profiles), the rest picked to match.
 */
const ENTITY_ICONS: Record<SuggestionEntityType, string> = {
  artisan_maker: 'solar:users-group-rounded-line-duotone',
  artisan_sculpt: KEEB_MODULE_ICONS.artisan,
  artisan_colorway: 'solar:palette-line-duotone',
  keyset_profile: 'solar:add-square-line-duotone',
  keyset: KEEB_MODULE_ICONS.keyset,
  keyset_kit: 'solar:box-line-duotone',
  keyboard_brand: 'solar:users-group-rounded-line-duotone',
  keyboard: KEEB_MODULE_ICONS.keyboard,
  keyboard_release: 'solar:rocket-line-duotone',
  keyboard_variant: 'solar:layers-line-duotone',
}

export const revisionEntityIcon = (revision: Pick<Revision, 'entity_type'>) =>
  ENTITY_ICONS[revision.entity_type] || 'solar:file-line-duotone'

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
  diffs: RevisionFieldDiff[],
) =>
  diffs.filter(
    (diff) => !isProtectedSuggestionField(revision.entity_type, diff.key),
  )

/** Fields of an undo (`revertableFields` of the change) changed again since. */
export const undoConflicts = (
  revision: RevisionDetail,
  undoFields: RevisionFieldDiff[],
) =>
  undoFields
    .filter((diff) => differs(revision.current?.[diff.key], diff.after))
    .map((diff) => diff.key)

/** `Name, Price and Status`, from field keys. */
export const revisionFieldList = (keys: string[]) => {
  const labels = keys.map(suggestionFieldLabel)

  return labels.length > 1
    ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
    : labels[0] || ''
}

/** What a revert wrote, for the page to reload or follow a renamed slug. */
export interface RevisionRevert {
  entityType: string
  changes: Record<string, unknown>
}

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

/** `Changes today`, `Changes yesterday`, `Changes on Nov 1, 2026`. */
const revisionDayHeading = (date: string) => {
  const days = daysAgo(date)

  if (days === 0) return 'Changes today'
  if (days === 1) return 'Changes yesterday'

  return `Changes on ${formatDate(date)}`
}

/**
 * Entries (newest first) by the day of their `date`, for the revision
 * timelines and Recent Changes.
 */
export const groupRevisionsByDay = <T extends { date: string }>(
  entries: T[],
) => {
  const days: { value: string; title: string; entries: T[] }[] = []

  for (const entry of entries) {
    const value = String(startOfDay(entry.date).getTime())
    const last = days.at(-1)

    if (last?.value === value) last.entries.push(entry)
    else {
      days.push({
        value,
        title: revisionDayHeading(entry.date),
        entries: [entry],
      })
    }
  }

  return days
}
