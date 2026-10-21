import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import {
  parseRevisionId,
  requireRevisionStaff,
  revisionError,
  revisionsTable,
} from '../../../utils/revisions'
import { canManageAssignment } from '~/utils/permissions'

const bodySchema = z.object({ mode: z.enum(['undo', 'restore']) })

/**
 * `{ mode: 'undo' }` writes back the values an edit replaced (409 with the
 * fields when they changed again since); `{ mode: 'restore' }` brings the
 * record back to the revision's snapshot. Both are new revisions, through
 * `revert_revision()`, whose record RLS decides the permission.
 */
export default defineEventHandler(async (event) => {
  const { client, profile } = await requireRevisionStaff(event)
  const id = parseRevisionId(getRouterParam(event, 'id'))
  const body = bodySchema.safeParse(await readBody(event))

  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid revert mode' })
  }

  const { data: revision, error } = await revisionsTable(client)
    .select('id, scope')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!revision) {
    throw createError({ statusCode: 404, statusMessage: 'Revision not found' })
  }

  if (!canManageAssignment(profile, revision.scope)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to change this record.',
    })
  }

  const { data, error: revertError } = await (client as any).rpc(
    'revert_revision',
    { p_id: id, p_mode: body.data.mode },
  )

  if (revertError) throw revisionError(revertError)

  return { changes: data }
})
