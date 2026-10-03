# Changelog

## [Unreleased]

### ✨ What's New

- **Community Submissions** — Signed-in users can propose artisan colorways, keyset kits, and keyboard variants at `/artisan/submissions/submit`, `/keyset/submissions/submit`, and `/keyboard/submissions/submit`. Each flow is a stepper wizard (Maker → Sculpt → Colorway, Profile → Keyset → Kit, Brand → Keyboard → Release → Variant) built on the shared atomic forms and Zod schemas. Every step either picks an existing record or proposes a new one, so users can also add a colorway, kit, release, or variant to an already-published sculpt, keyset, or keyboard without touching it. Proposals stay Pending (visible only to their submitter and staff) until reviewed.
- **Contextual Submission Links** — "Submit a Colorway/Kit/Release/Variant" buttons on detail pages preselect the existing parents and jump straight to the relevant step.
- **Moderation & Review Tables** — `/artisan/submissions`, `/keyset/submissions`, and `/keyboard/submissions` list one row per colorway, kit, or variant with a Pending/Approved/Rejected filter, scoped to the submitter or to the staff assigned to that content. Moderators get quick Approve/Reject, and an Edit wizard that lets them review the leaf together with any parent (sculpt, keyset, keyboard, release) still under review; approving the leaf approves those parents. Submitters can edit or delete their Pending/Rejected entries (editing a rejected one sends it back to Pending), and every row has a Delete action with confirmation.
- **Staff Auto-Approval** — Contributions by staff authorized for the relevant brand, profile, or maker are approved immediately; everyone else's enter the Pending queue.
- **Unified Submission Backend** — Colorways, kits, releases, and variants share one moderation layer (`server/utils/child-submissions.ts`) for ownership, approve/reject, cascade to parents, resubmission, and delete handling. `artisan_colorways.status` is renamed to `review_status` to match the other submission tables.
- **Trading Card Colorway Preview** — Redesigned the colorway preview into a Yu-Gi-Oh!/Pokémon-style trading card, with a selector to switch between the two styles directly in the preview modal.
- **Theme Preset System** — Users can now switch between theme presets (Default, Carbon, Parchment, Taro) from the profile menu or the Appearance settings tab. Each preset controls colors, fonts, component defaults, and CSS custom properties for semantic tokens; themes persist via cookie and apply immediately without reload.
- Added conditional top case styles selection for 60% and TKL keyboards with support for multiple choices.
- Migrated images to a CDN for faster loading.
- Added Google Docs sync override tracking for sculpts, mirroring the existing colorway override tracking.

### 🐛 Bug Fixes

- Fixed keyboard edit behavior so changing the keyboard name now regenerates slug consistently.
- Fixed the order graph/order history preview on keyset pages.
- Fixed the autocomplete component after a Nuxt UI breaking change.
- Fixed invertible logo display in the profile drawer.
- Hid the asking price on collection items marked as sold.
- Prevented invalid document IDs by initializing them as an empty array.
- Fixed a row-level security (RLS) error.
- Required contact info when marking a collection item as WTB or WTT.
- Removed the now-redundant `/keyset?status=pending` view now that pending keysets are reviewed from the dedicated Keyset Submissions page.

### 🚀 Improvements

- Replaced the dismissible top banner with persistent, cookie-gated toast notifications (site announcements, cookie consent, and the collection guide) that reappear on every visit until acknowledged.
- Unified role-based edit/moderation permissions (`admin`/`editor`/`maker`/`designer`) into a single shared permission utility used consistently across artisan, keyboard, and keyset pages.
- Allowed makers/editors to rename sculpts, with sculpt URLs now updating automatically to match the new name after save.
- Removed typing angle from release forms, moved mounting styles to keyboard forms, and added multiple-choice support for keyboard mounting styles.
- Added an uploading state indicator and original-value change tracking to the Colorway form for clearer Google Docs override detection.
