import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createError, defineEventHandler, readBody } from 'h3'
import type { Appearance } from '~/types/appearance'
import { themePresets } from '~/utils/theme-presets'

const COLOR_MODES = ['system', 'light', 'dark'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isColorMode(
  value: unknown,
): value is NonNullable<Appearance['colorMode']> {
  return COLOR_MODES.includes(value as (typeof COLOR_MODES)[number])
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  }

  if (user.sub !== id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body: unknown = await readBody(event)
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must be an object',
    })
  }

  const allowedFields = ['theme', 'colorMode'] as const
  if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only theme and colorMode can be updated',
    })
  }

  const patch: Appearance = {}
  if ('theme' in body) {
    if (
      typeof body.theme !== 'string' ||
      !themePresets.some((preset) => preset.id === body.theme)
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid theme',
      })
    }
    patch.theme = body.theme
  }

  if ('colorMode' in body) {
    if (!isColorMode(body.colorMode)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid color mode',
      })
    }
    patch.colorMode = body.colorMode
  }

  if (!Object.keys(patch).length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one appearance field is required',
    })
  }

  const client = await serverSupabaseClient(event)
  const { data: existing, error: readError } = await client
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (readError) {
    throw createError({
      statusCode: 500,
      statusMessage: readError.message,
    })
  }

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const currentAppearance = (
    existing as unknown as { appearance?: unknown }
  ).appearance
  const mergedAppearance = {
    ...(isRecord(currentAppearance) ? currentAppearance : {}),
    ...patch,
  }

  // The generated database types are refreshed after this local migration is applied.
  const { data: updated, error: updateError } = await client
    .from('users')
    .update({ appearance: mergedAppearance } as never)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message,
    })
  }

  if (!updated) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unable to update appearance',
    })
  }

  return { appearance: mergedAppearance }
})
