# Changelog

## [Unreleased]

### ✨ What's New

- **Community Submission Wizards** — Signed-in users can propose keyboards, keysets, and artisan colorways at `/{domain}/submissions/submit` using shared atomic forms, Zod validation, and stepper context: Maker → Sculpt → Colorway, Profile → Keyset → Kit, and Brand → Keyboard → Release → Variant. The same wizard handles create and review. Signed-in users can also propose a new Kit for a published keyset, or a new Release/Variant for a published keyboard; proposals stay Pending (visible only to their submitter and staff) while the published parent is left untouched.
- **Contextual Submission Links** — Detail-page entry points for colorways, kits, releases, and variants preselect existing parents and jump to the relevant step, preserving those selections while options load.
- **Moderation & Review Pages** — Status-filtered lists at `/keyboard/submissions`, `/keyset/submissions`, and `/artisan/submissions` provide scoped staff review and submitter views. Artisan, keyset, and keyboard reviews are tables with one row per colorway/kit/variant, quick Approve/Reject for moderators, and an Edit wizard (parent levels — sculpt, keyset, keyboard and release — are editable only while they are still under review; approving the leaf approves them). Submitters can edit a rejected entry to send it back to Pending.
- **Staff Auto-Approval** — Shared submission and kit/release/variant create endpoints auto-approve contributions by staff authorized for the relevant assignment; non-staff submissions enter Pending review.
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
