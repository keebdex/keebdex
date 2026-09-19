# Changelog

## [Unreleased]

## [4.2.0] - Open Palette

This release opens up colorway contributions to the whole community, adds a moderation workflow for staff, and ships a batch of keyboard/artisan fixes and improvements accumulated since 4.1.0.

### ✨ What's New

- **Community colorway submissions** — any signed-in user can now submit a new colorway for a sculpt. Submissions are shown publicly right away with an "Unverified" badge until a moderator reviews them.
- Added a **Colorway Submissions** dashboard at `/artisan/colorway-submissions`: Admins, Editors, and Makers can **approve**, **reject**, **edit & approve**, or **delete** pending/rejected submissions, while regular users can view, edit, and delete their own submission until it's reviewed, or delete it after it's rejected.
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

### 🚀 Improvements

- Replaced the dismissible top banner with persistent, cookie-gated toast notifications (site announcements, cookie consent, and the collection guide) that reappear on every visit until acknowledged.
- Unified role-based edit/moderation permissions (`admin`/`editor`/`maker`/`designer`) into a single shared permission utility used consistently across artisan, keyboard, and keyset pages.
- Allowed makers/editors to rename sculpts, with sculpt URLs now updating automatically to match the new name after save.
- Removed typing angle from release forms, moved mounting styles to keyboard forms, and added multiple-choice support for keyboard mounting styles.
- Added an uploading state indicator and original-value change tracking to the Colorway form for clearer Google Docs override detection.

### ⚠️ Breaking Changes

- None
