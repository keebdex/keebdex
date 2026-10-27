/**
 * Creates or updates a keyboard brand (`saveOwnerSubmission`): staff add
 * published brands, everyone else proposes one for review; the route param
 * is the slug.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'brand')!

  return omitSensitive(
    await saveOwnerSubmission(
      event,
      'keyboard',
      slug,
      pickTableFields('keyboard_brands', await readBody(event)),
    ),
  )
})
