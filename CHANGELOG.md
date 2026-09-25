# Changelog

## [Unreleased]

### ✨ What's New

- **Community Submissions Wizard** — Signed-in users can now contribute new keyboards, keysets, and artisan colorways using a 3-tier multi-step submission wizard at `/submissions/submit` that toggles between selecting existing entities and proposing new ones, powered by pure atomic forms and Zod schemas.
- **Contextual Submission Links** — Submitting directly from an existing entity page pre-fills parent steps in the wizard and jumps straight to the target creation step.
- **Moderation & Review Pages** — Added dedicated review pages (`/keyboard/submissions`, `/keyset/submissions`, `/artisan/submissions`) with a master-detail layout to filter by status (`Pending`/`Approved`/`Rejected`) and let staff approve, reject, or edit pending entries.
- **Submission Security & Self-Management** — Enforced RLS policies on submissions so only the submitter and staff can view unapproved entries, auto-approving staff contributions while allowing submitters and staff to delete pending or rejected entries.
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
