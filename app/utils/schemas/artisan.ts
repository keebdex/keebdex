import { Constants } from '~/types/database.types'
import { discordInviteRegex, instagramProfileRegex } from '~/utils'
import { z } from 'zod'

const optionalTextSchema = z.string().nullish().or(z.string().min(0).max(0))
const optionalUrlSchema = z.url().nullish().or(z.string().min(0).max(0))

export const artisanSaleFormats = Constants.public.Enums.sale_format
export const artisanSpecialSaleFormats = ['Giveaway', 'Commission', 'Auction']

export const makerSchema = z.object({
  name: z.string().min(1),
  id: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens only',
    )
    .nullish()
    .or(z.string().min(0).max(0)),
  country_origin: optionalTextSchema,
  founded: optionalTextSchema,
  document_ids: z.string().array(),
  website: optionalUrlSchema,
  instagram: z
    .url()
    .regex(instagramProfileRegex, 'Invalid Instagram profile URL')
    .nullish()
    .or(z.string().min(0).max(0)),
  discord: z
    .url()
    .regex(discordInviteRegex, 'Invalid Discord invite link')
    .nullish()
    .or(z.string().min(0).max(0)),
  artisancollector: optionalUrlSchema,
  disable_google_sync: z.boolean(),
})

export const sculptSchema = z.object({
  name: z.string().min(1),
  release: optionalTextSchema,
  profile: z.enum(['sculpted', 'blank']).nullish(),
  cast: z.enum(['resin', 'mixed']).nullish(),
  design: z.enum(['physical', 'digital', 'hybrid']).nullish(),
  collection: z.string().nullish(),
  is_revision_of: z.string().nullish(),
  story: optionalTextSchema,
})

export const colorwaySchema = z.object({
  name: optionalTextSchema,
  release: optionalTextSchema,
  qty: z.number().nullish(),
  order: z.number().nullish(),
  currency: z.enum(Constants.public.Enums.currency).nullish(),
  price: z.number().nullish(),
  sale_type: z.enum(artisanSaleFormats).nullish(),
  description: optionalTextSchema,
  img: optionalUrlSchema,
  photo_credit: optionalTextSchema,
  maker_id: z.string().min(1),
  sculpt_id: z.string().min(1),
  maker_sculpt_id: z.string().min(1),
})

export const artisanSubmissionCompositeSchema = z.object({
  colorway: colorwaySchema,
})
