# Changelog

## [Unreleased]

### ✨ What's New

- **Community Submission System** — any signed-in user can now contribute new **keyboards** (with releases and variants), **keysets** (with kits), and **artisan colorways** to Keebdex, not just staff. Submissions wait in a "Pending" state until reviewed; submissions created by staff (Admin/Editor/Maker) auto-approve immediately since they don't need to review their own work.
- Added dedicated moderation/review pages on the sidebar navigation for each module — `/keyboard/submissions`, `/keyset/submissions`, and `/artisan/submissions` — with a master-detail layout to filter by status (Pending/Approved/Rejected) and review full submission details before approving, rejecting, or editing.
- Row-level security policies track `review_status`/`status`, `submitted_by`, `verified_at`, and `verified_by` on `keyboards`, `keysets`, and `artisan_colorways`, so only the original submitter and staff (admin/editor/maker/designer) can view or manage a submission before it's approved.
- Submitters can delete their own submission while it's `Pending` or `Rejected`, and staff (Admin/Editor/Maker) can delete any submission in those states to clean up spam.
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

- Refactored submission forms around reusable atomic form components with `mode="standalone" | "embedded"`, shared Zod schemas in `app/utils/schemas/`, and dedicated `/submissions/submit` public creation routes for keyboard, keyset, and artisan flows.
- The `/submissions/submit` pages now use a `UStepper` wizard to walk through nested entities (Maker → Sculpt → Colorway, Profile → Keyset → Kit, Brand → Keyboard → Release/Variant): the first level is always a plain "select existing" step, the second level lets the user pick an existing entity or propose a new one, and the third level always creates a new sub-entity. The select-vs-create toggle lives in the wizard step, not in the atomic forms. Detail pages for an existing sculpt/keyset/keyboard now deep-link into the wizard with the entity pre-selected so it can jump straight to the last step.
- Replaced the dismissible top banner with persistent, cookie-gated toast notifications (site announcements, cookie consent, and the collection guide) that reappear on every visit until acknowledged.
- Unified role-based edit/moderation permissions (`admin`/`editor`/`maker`/`designer`) into a single shared permission utility used consistently across artisan, keyboard, and keyset pages.
- Allowed makers/editors to rename sculpts, with sculpt URLs now updating automatically to match the new name after save.
- Removed typing angle from release forms, moved mounting styles to keyboard forms, and added multiple-choice support for keyboard mounting styles.
- Added an uploading state indicator and original-value change tracking to the Colorway form for clearer Google Docs override detection.

### ⚠️ Breaking Changes

- None
