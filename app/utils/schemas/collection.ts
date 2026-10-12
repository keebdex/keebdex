import { z } from 'zod'
import { Constants } from '~/types/database.types'

/** `user_collections.intent`: what an artisan collection is for. */
export const COLLECTION_INTENTS = ['keep', 'want', 'sell'] as const

/** `user_collections.sort_by`: `<field>|<field>` or `order|asc` (manual). */
export const COLLECTION_SORTS = [
  'artisan.maker_sculpt_id|artisan.name',
  'artisan.name|artisan.maker_sculpt_id',
  'order|asc',
] as const

export const COLLECTION_CATEGORIES = Constants.public.Enums.module.map(
  (value) => value.toLowerCase(),
) as [string, ...string[]]

export type CollectionIntent = (typeof COLLECTION_INTENTS)[number]

// Empty inputs are stored as null.
const optionalText = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() || null : value),
  z.string().nullish(),
)

export const collectionSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    category: z.enum(COLLECTION_CATEGORIES),
    intent: z.enum(COLLECTION_INTENTS),
    sort_by: z.enum(COLLECTION_SORTS),
    contact: optionalText,
    message: optionalText,
  })
  .refine((data) => data.intent === 'keep' || !!data.contact, {
    message: 'Add a Discord username so others can reach you.',
    path: ['contact'],
  })
