export type ReviewDomain = 'artisan' | 'keyset' | 'keyboard'

// Quick replies offered when rejecting a submission; the moderator can still
// edit the note after picking one. Each stays within REVIEW_NOTE_MAX_LENGTH.
const COMMON_REJECT_NOTES = [
  'This is already listed on Keebdex.',
  'Please add a clear photo of the item itself, without heavy edits or watermarks.',
  "We couldn't verify this. Please add a link to the maker's, designer's, or vendor's official post.",
  'Some details look incorrect. Please check them against the official source and resubmit.',
]

const DOMAIN_REJECT_NOTES: Record<ReviewDomain, string[]> = {
  artisan: [
    'The photo shows a different colorway.',
    'This colorway belongs to a different sculpt.',
  ],
  keyset: [
    'This kit belongs to a different keyset.',
    'Please use the official kit name, such as Base, Novelties, or Spacebars.',
  ],
  keyboard: [
    'This variant belongs to a different keyboard or release.',
    'Please fill in the specs from the official product page.',
  ],
}

export const rejectNotePresets = (domain: ReviewDomain) => [
  ...DOMAIN_REJECT_NOTES[domain],
  ...COMMON_REJECT_NOTES,
]

// Quick replies offered when resolving feedback; the comment stays optional
// and editable.
export const RESOLVE_FEEDBACK_NOTES = [
  'Thanks! This is fixed in the latest release.',
  "Thanks for the suggestion! It's on our list for a future update.",
  'Thanks! The listing has been updated with your correction.',
  "We couldn't reproduce this. If it happens again, please send another note with the page and steps.",
  'Thanks for the feedback! This works as intended for now.',
]
