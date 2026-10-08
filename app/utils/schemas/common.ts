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
