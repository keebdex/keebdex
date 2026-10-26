/**
 * Creates or updates a maker (`saveOwnerSubmission`): staff add published
 * makers, everyone else proposes one for review; the route param is the
 * maker_id.
 */
export default defineEventHandler(async (event) => {
  const makerId = getRouterParam(event, 'maker')!

  return omitSensitive(
    await saveOwnerSubmission(
      event,
      'artisan',
      makerId,
      pickTableFields('artisan_makers', await readBody(event)),
    ),
  )
})
