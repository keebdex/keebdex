import { defineEventHandler } from 'h3'
import { listGroupedSubmissions } from '../../utils/submission-queue'

const KIT_SELECT =
  '*, category:kit_categories(name), keyset:keysets(profile_keyset_id, name, img, profile_id, review_status, profile:keyset_profiles(name), submitter:users!keysets_submitted_by_fkey(email, full_name)), submitter:users!keyset_kits_submitted_by_fkey(email, full_name)'

// One group per keyset, each holding its kits that match the status filter.
export default defineEventHandler((event) =>
  listGroupedSubmissions(event, {
    parentTable: 'keysets',
    childTable: 'keyset_kits',
    groupKey: 'profile_keyset_id',
    scopeColumn: 'profile_keyset_id',
    select: KIT_SELECT,
    parentName: 'keyset',
    childrenName: 'kits',
    parentOf: (kit) => kit.keyset,
  }),
)
