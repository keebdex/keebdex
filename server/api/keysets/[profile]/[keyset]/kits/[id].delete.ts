export default defineEventHandler(async (event) => {
  const { id, profile, keyset } = getRouterParams(event)
  const profileKeysetId = `${profile}/${keyset}`

  const { client, parent, isOfficial, isStaff } =
    await getChildSubmissionContext(event, 'keyset', profileKeysetId)
  const match = { profile_keyset_id: profileKeysetId }

  await deleteChildSubmission({
    client,
    table: 'keyset_kits',
    match: { ...match, id: id! },
    label: 'kit',
    note: await readDeletionNote(event, isStaff),
  })

  // A keyset under review with no kits left has nothing to review anymore.
  if (!isOfficial && parent.review_status) {
    await deleteParentIfEmpty(
      client,
      { table: 'keysets', match },
      { table: 'keyset_kits', match },
    )
  }

  return { success: true }
})
