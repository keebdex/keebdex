import { Constants } from '~/types/database.types'
import { discordInviteRegex, instagramProfileRegex } from '~/utils'
import { z, type RefinementCtx } from 'zod'

export const keyboardTopCaseStylesEnabled = ['60%', 'TKL']

export const optionalSlugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase letters, numbers, and hyphens only',
  )
  .nullish()
  .or(z.string().min(0).max(0))

export const brandSchema = z.object({
  name: z.string().min(1),
  slug: optionalSlugSchema,
  country_origin: z.string().nullish().or(z.string().min(0).max(0)),
  website: z.url().nullish().or(z.string().min(0).max(0)),
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
  bio: z.string().max(400).nullish().or(z.string().min(0).max(0)),
})

const requireTopCaseStyles = (
  value: { form_factor: string; top_case_styles: string[] },
  context: RefinementCtx,
) => {
  if (
    keyboardTopCaseStylesEnabled.includes(value.form_factor) &&
    value.top_case_styles.length === 0
  ) {
    context.addIssue({
      code: 'custom',
      path: ['top_case_styles'],
      message: 'Top case styles are required for this form factor',
    })
  }
}

const keyboardBaseSchema = z.object({
  name: z.string().min(1),
  slug: optionalSlugSchema,
  brand_slug: z.string().nullish(),
  form_factor: z.enum(Constants.public.Enums.keyboard_form_factor),
  top_case_styles: z.array(
    z.enum(Constants.public.Enums.keyboard_top_case_style),
  ),
  mount_styles: z
    .array(z.enum(Constants.public.Enums.keyboard_mounting_style))
    .nullish(),
  typing_angle: z.coerce.number().min(0).max(30).nullish(),
  derived_from: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Expected format: brand-slug/keyboard-slug',
    )
    .nullish()
    .or(z.string().min(0).max(0)),
  description: z.string().nullish(),
})

export const keyboardSchema =
  keyboardBaseSchema.superRefine(requireTopCaseStyles)

export const keyboardSubmissionSchema = keyboardBaseSchema
  .extend({
    brand_slug: z.string().min(1, 'Please choose a brand'),
  })
  .superRefine(requireTopCaseStyles)

export const keyboardReleaseSchema = z.object({
  name: z.string().min(1),
  release_year: z.coerce.number().min(1900).max(2100).nullish(),
  variant_specs: z.boolean().nullish(),
  currency: z
    .enum(Constants.public.Enums.currency)
    .nullish()
    .or(z.string().min(0).max(0)),
  msrp_price: z.coerce.number().min(0).nullish(),
  pcb_types: z
    .array(z.enum(Constants.public.Enums.keyboard_pcb_type))
    .nullish(),
  plate_materials: z
    .array(z.enum(Constants.public.Enums.keyboard_material))
    .nullish(),
  case_materials: z
    .array(z.enum(Constants.public.Enums.keyboard_material))
    .nullish(),
  weight_materials: z
    .array(z.enum(Constants.public.Enums.keyboard_material))
    .nullish(),
  description: z.string().max(400).nullish().or(z.string().min(0).max(0)),
})

export const keyboardVariantSchema = z.object({
  release_id: z.coerce.number().min(1).nullish(),
  variant_name: z.string().min(1),
  finish_type: z.enum(Constants.public.Enums.keyboard_finish_type),
  units_produced: z.coerce.number().min(0).nullish(),
  sale_type: z
    .enum(Constants.public.Enums.sale_format)
    .nullish()
    .or(z.string().min(0).max(0)),
  release_year: z.coerce.number().min(1900).max(2100).nullish(),
  img_front: z.url().nullish().or(z.string().min(0).max(0)),
  img_back: z.url().nullish().or(z.string().min(0).max(0)),
  photo_credit: z.string().max(255).nullish().or(z.string().min(0).max(0)),
  currency: z
    .enum(Constants.public.Enums.currency)
    .nullish()
    .or(z.string().min(0).max(0)),
  msrp_price: z.coerce.number().min(0).nullish(),
  case_materials: z
    .array(z.enum(Constants.public.Enums.keyboard_material))
    .nullish(),
  pcb_types: z
    .array(z.enum(Constants.public.Enums.keyboard_pcb_type))
    .nullish(),
  plate_materials: z
    .array(z.enum(Constants.public.Enums.keyboard_material))
    .nullish(),
  weight_materials: z
    .array(z.enum(Constants.public.Enums.keyboard_material))
    .nullish(),
})

export const keyboardVariantStandaloneSchema = keyboardVariantSchema.extend({
  release_id: z.coerce.number().min(1),
})

export const keyboardSubmissionCompositeSchema = z.object({
  keyboard: keyboardSubmissionSchema,
  releases: z.array(
    keyboardReleaseSchema.extend({
      variants: z.array(keyboardVariantSchema.omit({ release_id: true })),
    }),
  ),
})
