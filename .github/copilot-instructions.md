# Keebdex Copilot Instructions

## Project Overview

Keebdex is a Nuxt 4 application for keyboard collectors. It uses Vue 3, TypeScript, Nuxt UI, Tailwind CSS, Pinia, Nuxt Nitro/H3, and Supabase PostgreSQL.

Use Bun for local commands. The repository contains a `bun.lock` file.

## Important Commands

- `bun run dev`: start the Nuxt development server. The `predev` hook generates database field metadata first.
- `bun run build`: build for production. The `prebuild` hook generates database field metadata first.
- `bun run generate`: generate the static site; this also runs the metadata generation hook.
- `bun run generate:table-fields`: regenerate `server/utils/table-fields.generated.ts` from the database types.
- `bunx eslint .`: run ESLint. Use `bunx eslint . --fix` for automatic fixes; there is currently no `lint` script in `package.json`.
- `bun run preview`: preview a production build.

There is no test script or test suite currently defined in `package.json`. Do not claim tests passed unless a relevant check was actually run.

## Repository Layout

- `app/pages/`: Nuxt file-based pages and routes.
- `app/components/`: Vue components, organized by domain (`artisan`, `keyboard`, `keyset`, `collection`, `brand`, `shared`, and `modal`).
- `app/composables/`: reusable reactive application logic.
- `app/stores/`: Pinia stores, including the user store.
- `app/middleware/`: route guards such as authentication and admin access.
- `app/types/database.types.ts`: generated Supabase database types; treat this as generated source and do not edit it manually.
- `app/utils/`: client-side helpers and utilities.
- `server/api/`: Nitro/H3 file-based API handlers. The filename suffix defines the HTTP method, such as `.get.ts`, `.post.ts`, `.patch.ts`, or `.delete.ts`.
- `server/utils/`: server-side database, authorization, grouping, and response helpers.
- `scripts/`: repository maintenance scripts, including table-field metadata generation.
- `supabase/`: Supabase project configuration and database-related files (gitignored; not tracked in this repo).
- `public/`: static assets.

Preserve Nuxt file-based routing paths when moving or renaming pages and API handlers.

## Vue and Nuxt Conventions

- Follow the existing Vue 3 Composition API style with `<script setup>`.
- Keep Vue single-file component blocks in this order: `<template>`, then `<script setup>` (or `<script>` when required), then `<style>`.
- Use TypeScript for new application code unless the surrounding file is intentionally JavaScript.
- Keep components in PascalCase. Keep variables and functions in camelCase. Use snake_case for database identifiers.
- Keep domain-specific components in their existing domain folders; put genuinely reusable components in `app/components/shared/`.
- Prefer existing Nuxt UI components and the established slots/configuration over custom replacements.
- Use `NuxtImg` for optimized images where appropriate.
- Follow the existing mobile-first Tailwind styling and the design tokens in `app/app.config.ts` and `app/assets/main.css`.
- Use the centralized icon names configured in `app/app.config.ts` rather than introducing arbitrary icon sets.

## Server and Supabase Rules

- Define API handlers with `defineEventHandler` and use H3 helpers such as `getQuery`, `readBody`, and `createError` consistently with nearby code.
- Obtain the server Supabase client with `serverSupabaseClient(event)` and the authenticated user with `serverSupabaseUser(event)`.
- Use `requireAdminClient(event)` for admin-only server-side operations. For staff operations scoped to a specific assignment (editor/maker restricted to their assigned pages), use `getActorProfile(event)` plus `canManageAssignment`/`canManageAnyAssignment` from `~/utils/permissions` (also re-exported as `canModerateAssignment` in `server/utils/admin.ts`) instead of duplicating role checks.
- Preserve the existing middleware checks for protected pages (`app/middleware/admin.ts` for admin-only routes). For staff-but-not-admin pages, follow the existing pattern of a client-side guard (`<SharedRedirectPage v-if="!canX" to="..." />`) backed by a Pinia getter, rather than adding new route middleware.
- For insert, update, or patch payloads, use `pickTableFields(table, body)` from `server/utils/database.ts`. It validates that the body is an object and whitelists fields from generated metadata.
- Use `omitSensitive()` and existing response helpers when returning database records so internal fields such as `fts` are not exposed.
- Follow the existing pagination convention with `getQuery(event)` and Supabase `.range(from, to)`.
- Preserve existing full-text search behavior using Supabase `.textSearch()` where the endpoint already uses it.
- Use `createError({ statusCode, statusMessage })` for expected API errors and match nearby status codes and messages.
- Do not expose service-role credentials or bypass authorization checks from client code.
- For submitter-owned records (e.g. `artisan_colorways.submitted_by`), grant the original submitter limited edit/delete rights in addition to staff permissions, scoped by the record's status (e.g. only while still `Pending`, or not once `Approved`). Always re-check ownership and status server-side; never trust a client-supplied owner id.
- Image uploads (`server/api/images/upload.post.ts`) require staff permission via `canManageAssignment`, except the `artisan` and `keyset` module categories, which any authenticated user may upload to (community colorway/keyset submissions); the underlying record save still enforces its own permission checks.
- For schema changes, it's fine to draft a SQL migration under `supabase/migrations/` for the user to review and apply manually (e.g. via `supabase db push`); since `supabase/` is gitignored, these files stay local and are never committed.

## Community Submission Workflows

Keebdex supports community-submitted content that waits for staff review before becoming public, using a shared `submitted_by` / `verified_at` / `verified_by` + status pattern:

- **Artisan colorways**: submitted via the maker/sculpt colorway forms, reviewed at `/artisan/submissions` (`artisan_colorways.status`, `server/api/submissions/artisan*`).
- **Keysets**: any authenticated user can submit a keyset with its kits at `/keyset/submissions/submit` (`KeysetModalKeysetSubmissionForm`, `server/api/submissions/keyset.post.ts`). Submissions are reviewed at `/keyset/submissions`, a master-detail page (card list + detail panel) scoped to the current user unless they're staff, in which case they see and moderate everyone's submissions (`keysets.review_status`, `server/api/submissions/keyset*`). Approving/rejecting sets `verified_at`/`verified_by` and syncs the attached `keyset_kits` rows.
- **Keyboards**: any authenticated user can submit a keyboard with its releases and variants at `/keyboard/submissions/submit` (`KeyboardModalKeyboardSubmissionForm`, `server/api/submissions/keyboard.post.ts`). Submissions are reviewed at `/keyboard/submissions` (same master-detail layout as keysets), scoped by `brand_slug` assignments (`keyboards.review_status`, `server/api/submissions/keyboard*`).
- Both submission review APIs live under the shared `server/api/submissions/` namespace (`submissions/artisan*`, `submissions/keyset*`, `submissions/keyboard*`) to keep the format and permission patterns consistent across modules.
- All three review pages share `statusOptions` and `statusColorMap` from `app/utils/index.ts` for the Pending/Approved/Rejected filter UI instead of redeclaring them.
- A `review_status`/`status` value of `null` means the record was added directly by staff through an existing admin-only flow (not the community submission form) and is implicitly approved, excluded from the moderation queue entirely.

### Database & RLS conventions for submissions

- Any table that supports community submissions must carry the four control columns: `review_status` (or `status` on `artisan_colorways`, for historical reasons — don't rename it), `submitted_by`, `verified_at`, `verified_by`. Add these via a migration under `supabase/migrations/`, never by hand-editing generated types.
- RLS policies must allow: public `select` of `Approved`/`null` rows plus the submitter's own `Pending`/`Rejected` rows plus staff reading everything; authenticated `insert` restricted to `review_status IS NULL OR (review_status = 'Pending' AND submitted_by = auth.uid())`; staff-only `update` for moderation fields; submitter `update`/`delete` only while still `Pending`; staff `delete` of any `Pending`/`Rejected` row. Mirror the existing `keyset_submission_status.sql` / `artisan_colorway_submission_status.sql` migrations for exact policy wording.
- Child records (releases/variants/kits) don't get their own submission columns — their RLS policies and ownership checks always derive from the parent record's `submitted_by`/`review_status` via an `exists` subquery against the parent table.

### Auto-approve rule for staff submissions

- When the authenticated actor is staff for the relevant assignment (`canManageAnyAssignment(profile) && canManageAssignment(profile, assignment)`, e.g. `brand_slug` for keyboards, `profile_keyset_id` for keysets, `maker_id` for artisan colorways), a **create** through the shared submission form must auto-approve instead of entering the Pending queue: set `review_status`/`status = 'Approved'`, `verified_by = user.sub`, and `verified_at = new Date().toISOString()` in the same insert, rather than requiring the moderator to review/approve their own submission afterwards.
- Regular (non-staff) users always get `review_status = 'Pending'` with `verified_at`/`verified_by` left `null`.
- This check only applies to the shared `/api/submissions/*` create endpoints (and the shared artisan colorway create endpoint used by both the admin and community forms). Existing admin-only creation endpoints (e.g. `server/api/keyboards/[brand]/[keyboard].post.ts`) are unaffected — they never set these columns and stay implicitly approved via `null`.

### Delete cascade rule for submissions

- Deleting a parent submission (keyboard, keyset, colorway) must also remove its child records in the same request before deleting the parent row: keyboards cascade to `keyboard_releases` then `keyboard_variants`, keysets cascade to `keyset_kits`. Do this explicitly in the `[id].delete.ts` handler (delete children first, then the parent) rather than relying solely on a database `ON DELETE CASCADE`, since RLS on the child tables is scoped through the parent and a direct cascade may not be configured.
- Delete permission is always `isModerator || (isOwner && review_status !== 'Approved')` — never allow a non-staff owner to delete an already-`Approved` record.

### Submissions route naming convention

- Each module's moderation/review page lives at `/{module}/submissions` (e.g. `/keyboard/submissions`, `/keyset/submissions`, `/artisan/submissions`) and is linked from the sidebar under that module's section in `app/layouts/default.vue`, gated behind `authenticated.value`.
- The "create a new submission" page lives at `/{module}/submissions/submit` for keyboard/keyset (a nested route under the review page); artisan colorways are instead submitted from the existing maker/sculpt colorway form. Keep new submission flows consistent with the `submissions/submit` nested-route pattern unless there's already a more specific entry point for that module.

## Generated Data and Database Types

`app/types/database.types.ts` is generated from the Supabase schema, and `server/utils/table-fields.generated.ts` is generated from those types via `bun run generate:table-fields`. Never hand-edit or regenerate either file yourself; they are refreshed outside of your changes once the user applies any related migration against their Supabase project. When a migration adds/changes columns, just describe the expected shape in the migration's comments and leave the generated files untouched.

Keep database relationships and table names aligned with the generated `Database` type. Do not silently invent columns, tables, or enum values.

## State and Auth

Use the existing Pinia user store and composables before adding new global state. Role/assignment rules (`admin`, `editor`, `maker`, `designer`) are centralized in `app/utils/permissions.ts` (`canManageAssignment`, `canManageAnyAssignment`) and reused by both the client (`userStore.isEditable()`, `userStore.isModerator`) and server (`server/utils/admin.ts`). Do not reimplement role branching inline; extend or call the shared utility instead. Keep `app/middleware/auth.ts`, `app/middleware/admin.ts`, and server-side authorization checks aligned.

Site-wide announcements/notices (cookie consent, feature announcements, guides) use persistent toasts added in `app/layouts/default.vue`'s `onMounted`, not a banner component: gate each with its own `useCookie(...)`, set `duration: 0` and `close: false`, and only mark the cookie as acknowledged inside an action's `onClick` so the toast keeps reappearing until the user explicitly dismisses it.

## Formatting and Validation

- Match the repository's Prettier style: single quotes and no semicolons.
- Keep changes focused and avoid unrelated refactors.
- After editing, run the narrowest relevant check first, then `bunx eslint .` or `bunx eslint . --fix` when appropriate.
- For server or schema-related changes, run a production build when practical; do not run `bun run generate:table-fields` or edit the generated files yourself.
- Review route filenames in the final diff.
- Never commit secrets or `.env` files.

## Git and Documentation

Commit messages follow Conventional Commits through commitlint. Fold the `[Unreleased]` entries into a new dated version section in `CHANGELOG.md` along with the release notes when cutting a release. Do not create commits or branches unless explicitly requested.
