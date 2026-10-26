import { z } from 'zod'
import {
  OWNER_ENTITY_TYPES,
  SUGGESTION_ENTITY_TYPES,
} from '~/utils/suggestions'

export const SUGGESTION_REASON_MAX_LENGTH = 500

export const suggestionReasonSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() || null : value),
  z
    .string()
    .max(
      SUGGESTION_REASON_MAX_LENGTH,
      `The reason can be at most ${SUGGESTION_REASON_MAX_LENGTH} characters.`,
    )
    .nullable()
    .optional(),
)

// Suggested values, `{ column: value }`. Which columns may change is checked
// on the server against the table's columns and the protected ones.
export const suggestionChangesSchema = z
  .record(z.string(), z.unknown())
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Change at least one field.',
  })

export const createSuggestionSchema = z.object({
  entity_type: z
    .enum(SUGGESTION_ENTITY_TYPES)
    .refine((type) => !OWNER_ENTITY_TYPES.includes(type), {
      message: 'This record does not take suggestions yet.',
    }),
  entity_id: z.coerce.number().int().positive(),
  changes: suggestionChangesSchema,
  reason: suggestionReasonSchema,
})
