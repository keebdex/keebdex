import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { themePresets } from '~/utils/theme-presets'

const appearanceSchema = z
  .object({
    theme: z
      .string()
      .refine((id) => themePresets.some((preset) => preset.id === id), {
        error: 'Invalid theme',
      })
      .optional(),
    colorMode: z.enum(['system', 'light', 'dark']).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, {
    error: 'At least one appearance field is required',
  })

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const id = event.context.params?.id
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  if (user.sub !== id)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const result = appearanceSchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message,
    })
  }
  const patch = result.data

  const client = await serverSupabaseClient(event)
  const { data: existing, error: readError } = await client
    .from('users')
    .select('appearance')
    .eq('id', id)
    .maybeSingle()

  if (readError)
    throw createError({ statusCode: 500, statusMessage: readError.message })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const mergedAppearance = {
    ...existing.appearance,
    ...patch,
  }

  const { data: updated, error: updateError } = await client
    .from('users')
    .update({ appearance: mergedAppearance })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (updateError)
    throw createError({ statusCode: 500, statusMessage: updateError.message })
  if (!updated) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unable to update appearance',
    })
  }

  return { appearance: mergedAppearance }
})
