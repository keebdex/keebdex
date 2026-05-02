# Changelog

## [Unreleased]

### ✨ What's New

- Added CSV color import with preview and a matching system filter for narrowing results.
- Added RAL code auto-fill support to fetch hex and name automatically, with a manual refetch action for supported systems.
- Added admin feedback management page with expandable rows, resolve action, and a one-click promotion flow to move feedback into shoutouts.
- Added public shoutouts page at `/shoutouts` so users can browse all approved testimonials.
- Added admin shoutouts management page at `/admin/shoutouts` and switched feedback/testimonial status updates to record-level CRUD update APIs.

### 🐛 Bug Fixes

- Prevented duplicate color entries via conflict handling and fixed unsafe CSV header parsing for malformed files.

### 🚀 Improvements

- Enhanced color creation with code suggestions, duplicate hints, and helper text for display name.
- Introduced `useGuardedSearch` and `useAdvancedSearch` composables to centralize API search logic across form components, with consistent minimum term length handling, filtering, and pagination support.
