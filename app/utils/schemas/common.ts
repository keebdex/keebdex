import { z } from 'zod'

// Used by wizard steps that only allow picking an existing entity (e.g. maker, profile, brand).
export const entitySelectionSchema = z.object({
  id: z.string().min(1, 'Please make a selection'),
})
