import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createError, defineEventHandler, readBody } from 'h3'
import { Constants } from '~/types/database.types'

const ALLOWED_ROLES = new Set(Constants.public.Enums.user_role)

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  const { data: actor, error: actorError } = await client
    .from('users')
    .select('role')
    .eq('id', user.sub)
    .single()

  if (actorError) {
    throw createError({
      statusCode: 500,
      statusMessage: actorError.message,
    })
  }

  if (!actor || actor.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  }

  const body = await readBody(event)

  const role = body?.role ?? null
  const assignments = Array.isArray(body?.assignments)
    ? [
      ...new Set(
        body.assignments
          .map((item) => String(item).trim())
          .filter(Boolean),
      ),
    ]
    : null

  if (role !== null && !ALLOWED_ROLES.has(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
  }

  const payload = {
    role,
    assignments,
  }

  const { data, error } = await client
    .from('users')
    .update(payload)
    .eq('id', id)
    .select('id, email, role, assignments')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
