# Changelog

## [Unreleased]

Throw the **doors open** — anyone signed in can now contribute to the catalog. This release adds community submissions for keyboards, keysets, and artisan colorways, with full moderation tools behind them, plus theme presets, a trading-card colorway preview, and a batch of fixes.

### ✨ What's New

- **Community Submissions** — Signed-in users can now propose **artisan colorways**, **keyset kits**, and **keyboard variants** through guided step-by-step wizards. Each step either picks an existing record or proposes a new one, so you can extend an already-published sculpt, keyset, or keyboard without recreating it. Submissions stay _Pending_ — visible only to you and staff — until reviewed.
- **Contextual Submission Links** — "Submit a Colorway/Kit/Release/Variant" buttons on detail pages preselect the parent items and jump straight to the right step.
- **Moderation & Review** — Dedicated review pages for artisans, keysets, and keyboards with _Pending / Approved / Rejected_ filtering. Moderators get quick Approve/Reject plus an edit wizard, and submitters can edit or delete their own pending or rejected entries.
- **Staff Auto-Approval** — Contributions from staff authorized for the relevant brand, profile, or maker go live immediately; everyone else enters the review queue.
- **Trading Card Colorway Preview** — Redesigned the colorway preview into a Yu-Gi-Oh!/Pokémon-style trading card, with a selector to switch between the two styles in the preview modal.
- **Theme Presets** — Switch between presets (_Aurora_, _Carbon_, _EVA-01_, _Parchment_, _Taro_) from the profile menu or Appearance settings. Each controls colors, fonts, and component defaults, and applies instantly without a reload.
- Added conditional top case styles for 60% and TKL keyboards, with multiple-choice support.
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
