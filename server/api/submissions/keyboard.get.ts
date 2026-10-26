import { defineEventHandler } from 'h3'
import {
  KEYBOARD_QUEUE,
  listGroupedSubmissions,
} from '../../utils/submission-queue'

const VARIANT_SELECT =
  '*, release:keyboard_releases(id, name, review_status, submitted_by, keyboard:keyboards(brand_keyboard_slug, name, brand_slug, form_factor, review_status, brand:keyboard_brands(name, review_status), submitter:users!keyboards_submitted_by_fkey(email, full_name))), submitter:users!keyboard_variants_submitted_by_fkey(email, full_name)'

// One group per keyboard, each holding its variants (keyboard > release >
// variant) that match the status filter.
export default defineEventHandler((event) =>
  listGroupedSubmissions(event, {
    queue: KEYBOARD_QUEUE,
    select: VARIANT_SELECT,
    parentName: 'keyboard',
    childrenName: 'variants',
    parentOf: (variant) => variant.release?.keyboard,
  }),
)
