import { z } from 'zod'

// Used by wizard steps that only allow picking an existing entity (e.g. maker, profile, brand).
export const entitySelectionSchema = z.object({
  id: z.string().min(1, 'Please make a selection'),
})

type SafeParser = {
  safeParse: (value: unknown) => { success: boolean }
}

// Validates repeatable wizard items (colorways, kits, variants), returning the
// first failure or a success result.
export const validateEach = (schema: SafeParser, items: unknown[]) => {
  for (const item of items) {
    const result = schema.safeParse(item)
    if (!result.success) return result
  }

  return { success: true as const }
}

export const REVIEW_NOTE_MAX_LENGTH = 280

// A note staff write for the person who submitted something (a reject
// reason, a resolution comment); they read it in their notification.
const noteSchema = (requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .max(
      REVIEW_NOTE_MAX_LENGTH,
      `The note can be at most ${REVIEW_NOTE_MAX_LENGTH} characters.`,
    )

export const reviewNoteSchema = noteSchema(
  'Add a note explaining why this submission is rejected.',
)

export const resolutionNoteSchema = noteSchema(
  'Add a comment for the person who sent this feedback.',
)
