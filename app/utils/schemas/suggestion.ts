import { z } from 'zod'
import {
  SUGGESTION_ENTITIES,
  SUGGESTION_ENTITY_TYPES,
} from '~/utils/suggestions'
import type {
  SuggestionEntityType,
  SuggestionField,
} from '~/utils/suggestions'

export const SUGGESTION_REASON_MAX_LENGTH = 500

const TEXT_MAX_LENGTH: Partial<Record<SuggestionField['type'], number>> = {
  text: 255,
  textarea: 4000,
}

// Blank inputs mean "no value": empty strings and empty lists become null,
// matching how the save endpoints store them.
const blankToNull = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  return Array.isArray(value) && !value.length ? null : value
}

const valueSchema = (field: SuggestionField): z.ZodType => {
  switch (field.type) {
    case 'url':
    case 'image':
      return z.url(`${field.label} must be a valid link.`)
    case 'number':
      return z.coerce
        .number(`${field.label} must be a number.`)
        .min(0, `${field.label} cannot be negative.`)
    case 'date':
      return z.iso.date(`${field.label} must be a date.`)
    case 'select':
      return z.enum(field.options as [string, ...string[]])
    case 'multiselect':
      return z.array(z.enum(field.options as [string, ...string[]]))
    case 'boolean':
      return z.boolean()
    default:
      return z
        .string()
        .max(
          TEXT_MAX_LENGTH[field.type] || 255,
          `${field.label} is too long.`,
        )
  }
}

const fieldSchema = (field: SuggestionField) => {
  const schema = valueSchema(field)

  return z.preprocess(
    blankToNull,
    field.required
      ? schema.nullable().refine((value) => value !== null, {
          message: `${field.label} is required.`,
        })
      : schema.nullable(),
  )
}

/**
 * Validates and normalizes the suggested values of a record: only the fields
 * listed in `SUGGESTION_ENTITIES` are accepted (strict), blanks become null.
 */
export const suggestionChangesSchema = (type: SuggestionEntityType) =>
  z
    .object(
      Object.fromEntries(
        SUGGESTION_ENTITIES[type].fields.map((field) => [
          field.key,
          fieldSchema(field).optional(),
        ]),
      ),
    )
    .strict('This field cannot be suggested.')
    .refine((changes) => Object.keys(changes).length > 0, {
      message: 'Change at least one field.',
    })

export const suggestionReasonSchema = z.preprocess(
  blankToNull,
  z
    .string()
    .max(
      SUGGESTION_REASON_MAX_LENGTH,
      `The reason can be at most ${SUGGESTION_REASON_MAX_LENGTH} characters.`,
    )
    .nullable()
    .optional(),
)

export const createSuggestionSchema = z.object({
  entity_type: z.enum(SUGGESTION_ENTITY_TYPES),
  entity_id: z.coerce.number().int().positive(),
  changes: z.record(z.string(), z.unknown()),
  reason: suggestionReasonSchema,
})
