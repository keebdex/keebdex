import { Constants } from '~/types/database.types'
import { z } from 'zod'

const optionalUrlSchema = z.url().nullish().or(z.string().min(0).max(0))
const optionalTextSchema = z.string().nullish().or(z.string().min(0).max(0))

export const createKeysetSchema = (manufacturers, options = {}) =>
  z.object({
    name: z.string().min(1),
    designer: optionalTextSchema,
    sculpt: optionalTextSchema,
    profile_id: z
      .string()
      .min(1, options.profileMessage || 'Invalid keyset profile')
      .refine(
        (value) => !!manufacturers.value[value],
        'Invalid keyset profile',
      ),
    url: optionalUrlSchema,
    img: optionalUrlSchema,
    status: z.enum(Constants.public.Enums.keyset_status).nullish(),
    review_status: z.enum(Constants.public.Enums.review_status).nullish(),
    order_graph: optionalUrlSchema,
    order_history: optionalUrlSchema,
    description: optionalTextSchema,
  })

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

export const createKeysetSubmissionCompositeSchema = (manufacturers) =>
  z.object({
    keyset: createKeysetSchema(manufacturers, {
      profileMessage: 'Please choose a profile',
    }),
    kits: z.array(keysetKitSchema),
  })
