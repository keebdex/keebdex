# Changelog

## [Unreleased]

Throw the **doors open** — anyone signed in can now contribute to the catalog. This release adds community submissions for keyboards, keysets, and artisan colorways, with full moderation tools behind them, plus theme presets, a trading-card colorway preview, and a batch of fixes.

### ✨ What's New

- Signed-in users can now propose artisan colorways, keyset kits, and keyboard variants through step-by-step **community submission** wizards that extend an existing sculpt, keyset, or keyboard or propose a new one, and submissions stay _Pending_ (visible only to you and staff) until reviewed.
- **Contextual submission links** ("Submit a Colorway/Kit/Release/Variant") on detail pages preselect the parent items and jump straight to the right step.
- New **moderation and review** pages for artisans, keysets, and keyboards filter by _Pending / Approved / Rejected_, group keyset and keyboard submissions under their parent with _Approve All_ / _Reject All_, and let submitters edit or delete their own pending or rejected entries (editing a rejected one sends it back for review).
- Contributions from staff authorized for the relevant brand, profile, or maker are **auto-approved** and go live immediately, while everyone else's enter the review queue.
- The colorway preview is now a Yu-Gi-Oh!- or Pokémon-style **trading card**, switchable in the preview modal.
- **Theme presets** (_Analog Dreams_, _Aurora_, _Carbon_, _EVA-01_, _Parchment_, _Taro_) can be switched from the profile menu or Appearance settings and apply instantly without a reload.
- Signed-in users' theme and light/dark mode preferences now **sync across devices**.
- Added conditional top case styles for 60% and TKL keyboards, with multiple-choice support.
- Migrated images to a CDN for faster loading.
- Added Google Docs sync override tracking for sculpts, mirroring the existing colorway override tracking.

### 🐛 Bug Fixes

- Fixed keyboard edit behavior so changing the keyboard name now regenerates slug consistently.
- Saving a colorway, keyset, kit, or variant now waits until its images finish uploading.
- Fixed adding a new sculpt from the sculpt form.
- Fixed artisan statistics being off by one day.
- Form validation toasts now show the actual problem instead of a generic "Something went wrong", and notification messages use consistent wording across the app.
- Fixed horizontal overflow on management pages and missing button labels on mobile.
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
