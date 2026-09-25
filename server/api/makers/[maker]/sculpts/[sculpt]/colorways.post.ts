import { crc32 } from 'crc'
import omit from 'lodash.omit'
import slugify from 'slugify'

const selfMakers = ['alpha-keycaps', 'gooey-keys']

// Moderation fields are only ever set by the server, never trusted from the client.
// TODO: drop this `Record<string, unknown>` cast once the submission-status
// migration has been applied and `bun run generate:table-fields` regenerated.
const MODERATION_ONLY_FIELDS = [
  'status',
  'submitted_by',
  'verified_at',
  'verified_by',
]

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const body = pickTableFields('artisan_colorways', await readBody(event))
  const rest: Record<string, unknown> = omit(body, MODERATION_ONLY_FIELDS)
  const makerId = String(rest.maker_id || '')

  const isModerator = canModerateAssignment(profile, makerId)

  if (rest.id) {
    if (!isModerator) {
      // The original submitter may still edit their own submission, but only
      // while it's awaiting review.
      const { data: existing, error: existingError } = await client
        .from('artisan_colorways')
        .select('submitted_by, status')
        .eq('id', rest.id)
        .single()

      if (
        existingError ||
        !existing ||
        existing.submitted_by !== user.sub ||
        existing.status !== 'Pending'
      ) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
      }
    }
  } else if (isModerator) {
    // Staff submitting through the community form don't need to self-approve.
    rest.status = 'Approved'
    rest.submitted_by = user.sub
    rest.verified_by = user.sub
    rest.verified_at = new Date().toISOString()
    rest.source = 'keebdex'
    rest.overridden_fields = []
  } else {
    // Community submission: mark as pending and record the submitter.
    rest.status = 'Pending'
    rest.submitted_by = user.sub
    rest.source = 'keebdex'
    rest.overridden_fields = []
  }

  if (!rest.colorway_id || selfMakers.includes(makerId)) {
    const slug = slugify(String(rest.name), { lower: true })
    rest.colorway_id = crc32(
      `${rest.maker_id}-${rest.sculpt_id}-${slug}-${rest.order}`,
    ).toString(16)
  }

  const sqlQuery = rest.id
    ? client.from('artisan_colorways').update(rest).eq('id', rest.id)
    : client
        .from('artisan_colorways')
        .upsert(rest)
        .eq('colorway_id', rest.colorway_id)
        .eq('maker_id', rest.maker_id)
        .eq('sculpt_id', rest.sculpt_id)

  const { data, error } = await sqlQuery.select()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
