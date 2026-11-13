import { createError, defineEventHandler, readBody } from 'h3'
import { Constants } from '~/types/database.types'
import { requireAdminClient } from '../../../utils/admin'

const ALLOWED_ROLES = new Set(Constants.public.Enums.user_role)

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  }

  const body = await readBody(event)

  const role = body?.role ?? null
  const assignments = Array.isArray(body?.assignments)
    ? [
        ...new Set(
          body.assignments.map((item: unknown) => String(item).trim()).filter(Boolean),
        ),
      ]
    : null

  if (role !== null && !ALLOWED_ROLES.has(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
  }

  // The Supporter badge is independent of the role; left as is when omitted
  const supporter = body?.supporter
  if (supporter !== undefined && typeof supporter !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid supporter' })
  }

  const payload = {
    role,
    assignments,
    ...(supporter !== undefined && { supporter }),
  }

  const { data, error } = await client
    .from('users')
    .update(payload)
    .eq('id', id)
    .select('id, email, role, supporter, assignments')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})