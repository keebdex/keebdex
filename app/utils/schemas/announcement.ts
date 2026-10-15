import { z } from 'zod'

export const ANNOUNCEMENT_AUDIENCES = [
  'all',
  'guest',
  'signed_in',
  'mods',
] as const

/** Besides the Announcements tab, where every announcement is listed. */
export const ANNOUNCEMENT_DISPLAYS = ['toast', 'banner', 'none'] as const

export const ANNOUNCEMENT_COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const

/**
 * An `https://` URL or an internal path (`/x`, not protocol-relative `//x`),
 * without whitespace. Matches the `announcements_cta_url_check` constraint.
 */
export const announcementUrlRegex = /^(https:\/\/[^/\s]\S*|\/([^/\\\s]\S*)?)$/

export const announcementKeyRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/

// Empty strings from the form are stored as null.
const optionalText = (max: number, message?: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' && !value.trim() ? null : value),
    z.string().trim().max(max, message).nullish(),
  )

const dateTimeSchema = z.iso.datetime({
  offset: true,
  error: 'Pick a valid date.',
})

/** Columns an admin writes; no cross-field checks (see `announcementSchema`). */
export const announcementFieldsSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Add a key.')
    .max(64, 'The key can be at most 64 characters.')
    .regex(
      announcementKeyRegex,
      'Use lowercase letters, numbers, and hyphens only.',
    ),
  title: z
    .string()
    .trim()
    .min(1, 'Add a title.')
    .max(80, 'The title can be at most 80 characters.'),
  description: optionalText(
    280,
    'The description can be at most 280 characters.',
  ),
  icon: optionalText(100),
  color: z.enum(ANNOUNCEMENT_COLORS),
  cta_label: optionalText(30, 'The button label can be at most 30 characters.'),
  cta_url: z.preprocess(
    (value) => (typeof value === 'string' && !value.trim() ? null : value),
    z
      .string()
      .trim()
      .regex(
        announcementUrlRegex,
        'Use an https:// URL or an internal path starting with /.',
      )
      .nullish(),
  ),
  display: z.enum(ANNOUNCEMENT_DISPLAYS),
  audience: z.enum(ANNOUNCEMENT_AUDIENCES),
  priority: z.number().int().min(-1000).max(1000),
  starts_at: dateTimeSchema,
  ends_at: dateTimeSchema.nullish(),
})

type AnnouncementFields = z.infer<typeof announcementFieldsSchema>

// The same cross-field rules as the table constraints.
const checkAnnouncement = (
  value: Partial<AnnouncementFields>,
  ctx: z.RefinementCtx,
) => {
  if (!!value.cta_label !== !!value.cta_url) {
    ctx.addIssue({
      code: 'custom',
      path: [value.cta_label ? 'cta_url' : 'cta_label'],
      message: 'Add both a button label and a link, or neither.',
    })
  }

  if (
    value.starts_at &&
    value.ends_at &&
    new Date(value.ends_at) <= new Date(value.starts_at)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['ends_at'],
      message: "The last day can't be before the start.",
    })
  }
}

/** A new announcement. */
export const announcementSchema =
  announcementFieldsSchema.superRefine(checkAnnouncement)

/**
 * Changes to an existing announcement: any columns but the key. Cross-field
 * rules that need the stored row are left to the table constraints.
 */
export const announcementPatchSchema = announcementFieldsSchema
  .omit({ key: true })
  .partial()
  .superRefine(checkAnnouncement)
