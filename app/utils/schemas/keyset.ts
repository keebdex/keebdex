import { Constants } from '~/types/database.types'
import { z } from 'zod'
import { KEYSET_STATUSES } from '~/utils/keyset-status'

const optionalUrlSchema = z.url().nullish().or(z.string().min(0).max(0))
const optionalTextSchema = z.string().nullish().or(z.string().min(0).max(0))
// Dates as the API stores them. Not part of `createKeysetSchema`: the forms
// hold them as CalendarDate until they submit.
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
  .nullish()
  .or(z.string().min(0).max(0))

export const createKeysetSchema = (manufacturers?: any, options: any = {}) => {
  let profileSchema = z
    .string()
    .min(1, options?.profileMessage || 'Invalid keyset profile')

  if (manufacturers) {
    profileSchema = profileSchema.refine(
      (value: string) => {
        const map =
          'value' in manufacturers ? manufacturers.value : manufacturers
        return !map || !!map[value]
      },
      'Invalid keyset profile',
    )
  }

  return z.object({
    name: z.string().min(1),
    designer: optionalTextSchema,
    sculpt: optionalTextSchema,
    profile_id: profileSchema,
    url: optionalUrlSchema,
    img: optionalUrlSchema,
    status: z.enum(KEYSET_STATUSES).optional(),
    review_status: z.enum(Constants.public.Enums.review_status).nullish(),
    order_graph: optionalUrlSchema,
    order_history: optionalUrlSchema,
    description: optionalTextSchema,
  })
}

export const keysetKitSchema = z.object({
  kit_id: z.string(),
  name: optionalTextSchema,
  qty: z.number().nullish(),
  price: z.number().nullish(),
  img: optionalUrlSchema,
  description: optionalTextSchema,
  cancelled: z.boolean().catch(false),
})

export const keysetColorSchema = z.object({
  system: z.enum(Constants.public.Enums.keyset_color_matching_system),
  code: z.string().min(1),
  name: optionalTextSchema,
  hex: z
    .string()
    .lowercase()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/),
})

export const keysetColorLinkSchema = z.object({
  profile_keyset_id: z.string(),
  color_ids: z.number().array().min(1),
})

export const keysetProfileSchema = z.object({
  name: z.string().min(1),
  profile: z.enum(Constants.public.Enums.keyset_profile).nullish(),
  manufacturer: optionalTextSchema,
  manufacturer_id: optionalTextSchema,
  description: optionalTextSchema,
})
