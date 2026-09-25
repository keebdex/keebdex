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

## Form Architecture

- New entity forms must follow the Atomic Form + Composite Wrapper pattern: atomic forms own the field UI for one entity and accept `mode: 'standalone' | 'embedded'` with a default of `'standalone'`.
- In `standalone` mode, atomic forms may wrap themselves in `UForm`, render their own Submit/Cancel actions, and perform direct admin/edit API saves. In `embedded` mode, they must expose state through `v-model`/`update:modelValue`, hide their standalone actions, and let the parent composite own validation, navigation, and submit actions.
- Composite submission forms (`*SubmissionForm.vue`) orchestrate multi-step or multi-entity state, progress/navigation, moderation actions, and the final API submit. They should embed atomic forms with `mode="embedded"` instead of duplicating input fields.
- All form validation schemas must be defined with Zod in `app/utils/schemas/` and reused by both standalone atomic forms and composite submission forms. Keep form-specific dynamic refinements in the component only when they depend on local runtime data.

### Nested submission wizards

- Multi-level "create a submission" flows (Maker → Sculpt → Colorway, Profile → Keyset → Kit, Brand → Keyboard → Release → Variant) use a `UStepper`-based wizard component named `SubmissionWizard.vue` in each domain's `modal/` folder (`app/components/artisan/modal/SubmissionWizard.vue`, `app/components/keyset/modal/SubmissionWizard.vue`, `app/components/keyboard/modal/SubmissionWizard.vue`, registered globally as `ArtisanModalSubmissionWizard` / `KeysetModalSubmissionWizard` / `KeyboardModalSubmissionWizard`) instead of one flat composite form.
- The top-level entity (Maker/Profile/Brand) is always a plain "select existing" step — public users never create a new maker/profile/brand from this flow.
- Every subsequent step that can reuse an existing record (Sculpt/Keyset/Keyboard, and the keyboard wizard's Release step) follows the same toggle pattern: a `UTabs` bound to a `*Mode` ref (`'existing' | 'new'`) that switches between a plain select (filtered by the parent selection) and the matching atomic form in `mode="embedded"`. This toggle lives in the wizard step's template, never inside the atomic form, and is only shown once the options list for that level has loaded and is non-empty — otherwise the mode is forced to `'new'` (see the `watch([...Options, ...Status], ...)` guards in each wizard composable).
- The final level (Colorway/Kit/Variant) always renders the relevant atomic form(s) in `mode="embedded"` to create new record(s), repeatable via "Add Colorway"/"Add Kit"/"Add Variant".
- Each wizard step is validated with the entity's Zod schema (or `entitySelectionSchema` from `app/utils/schemas/common.ts` for a plain selection) before advancing; validation lives in the paired composable (`useArtisanSubmissionWizard`, `useKeysetSubmissionWizard`, `useKeyboardSubmissionWizard`), not in the component.
- These wizard composables call the existing single-entity APIs sequentially instead of requiring new backend endpoints (e.g. create the sculpt via `POST /api/makers/[maker]/sculpts/[sculpt]`, then create the colorway via the existing colorway endpoint). When the user picks "propose new" at an intermediate level, creating that record first also satisfies the RLS ownership needed for the next level's create call.
- Attaching a new kit/release to an **existing** (not-owned, already-`Approved`) keyset/keyboard is only possible for staff on that assignment; RLS has no Pending state to grant for child rows in that case. The wizard composables catch that failure and surface a friendly message rather than a raw RLS error.
- Endpoints that return a parent entity together with a keyed collection of children (e.g. `GET /api/makers/[maker]` returns `sculpts` as an object keyed by `sculpt_id`, not an array — see `sortSculpts`/`keyBy` in `server/api/makers/[maker].get.ts`) must be unwrapped with `Object.values(...)` on the client before being used as `USelectMenu`/`UTabs` items or list options. Calling `.map()` directly on that response throws and silently empties the computed, which is what caused the artisan wizard's Sculpt step to appear blank after picking a maker.
- The existing flat composite components (`KeysetSubmissionForm.vue`, `KeyboardSubmissionForm.vue`, and their paired composables `useKeysetSubmission.ts`/`useKeyboardSubmission.ts`) are intentionally left as-is for now — they're reused by the moderation/review pages (`/keyset/submissions`, `/keyboard/submissions`) to edit an already-submitted record with its **full** kit/release(+variant) list and Approve/Reject/Delete actions. Unlike the public wizard (which only ever creates one kit/release per pass), a Pending submission reviewed by staff can carry multiple releases or kits accumulated over several wizard submissions, which doesn't fit the wizard's single-child-per-pass data model. Consolidating review onto the wizard component is a deliberate future refactor, not done yet — don't delete these files without redesigning that flow first.
- `KeysetForm.vue`'s Status and Review Status fields are always rendered (not gated behind `moderator`/`isEdit`); the Review Status select is simply `disabled` unless `useUserStore().isModerator` is true, read directly from the store rather than passed in as a `moderator` prop. Any composite embedding `KeysetForm` only needs to pass `:is-edit` — regular users can still see (but not change) Review Status.
- `KeysetForm.vue` emits its GB date-range picker via `v-model:date-range` separately from the main `v-model` state (because the picker works with `CalendarDate` objects, not ISO strings). Any composite/wizard embedding `KeysetForm` in `mode="embedded"` must bind `v-model:date-range` to its own ref and convert `start`/`end` with `toISODate(...)` into `start_date`/`end_date` before submitting — omitting this binding silently drops the GB time on submit.

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

- **Artisan colorways**: submitted at `/artisan/submissions/submit` via a Maker → Sculpt → Colorway wizard (`ArtisanModalSubmissionWizard`, `useArtisanSubmissionWizard`), with maker/sculpt pre-selected from query parameters and the wizard jumping straight to the Colorway step when launched from a sculpt page. Reviewed at `/artisan/submissions` (`artisan_colorways.status`, `server/api/submissions/artisan*`).
- **Keysets**: any authenticated user can submit a keyset kit at `/keyset/submissions/submit` via a Profile → Keyset → Kit wizard (`KeysetModalSubmissionWizard`, `useKeysetSubmissionWizard`, reusing `server/api/submissions/keyset.post.ts` for a new keyset and `server/api/keysets/[profile]/[keyset]/kits.post.ts` for the kit). Submissions are reviewed at `/keyset/submissions`, a master-detail page (card list + detail panel, using the separate `KeysetModalKeysetSubmissionForm` edit composite) scoped to the current user unless they're staff, in which case they see and moderate everyone's submissions (`keysets.review_status`, `server/api/submissions/keyset*`). Approving/rejecting sets `verified_at`/`verified_by` and syncs the attached `keyset_kits` rows.
- **Keyboards**: any authenticated user can submit a keyboard release/variant at `/keyboard/submissions/submit` via a Brand → Keyboard → Release → Variant wizard (`KeyboardModalSubmissionWizard`, `useKeyboardSubmissionWizard`, reusing `server/api/submissions/keyboard.post.ts` for a new keyboard and `server/api/keyboards/[brand]/[keyboard]/releases.post.ts` + `variants.post.ts` for the release/variant — the release step follows the same select-existing/propose-new toggle as the keyboard step). Submissions are reviewed at `/keyboard/submissions` (same master-detail layout as keysets, using the separate `KeyboardModalKeyboardSubmissionForm` edit composite), scoped by `brand_slug` assignments (`keyboards.review_status`, `server/api/submissions/keyboard*`).
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
- The "create a new submission" page lives at `/{module}/submissions/submit` for keyboard, keyset, and artisan (a nested route under the review page). Public user create/contribute buttons for main entities should route there. Standalone modals are reserved for admin dashboard direct CRUD and quick-create/edit of sub-entities inside admin/detail contexts.

## Generated Data and Database Types

`app/types/database.types.ts` is generated from the Supabase schema, and `server/utils/table-fields.generated.ts` is generated from those types via `bun run generate:table-fields`. Never hand-edit or regenerate either file yourself; they are refreshed outside of your changes once the user applies any related migration against their Supabase project. When a migration adds/changes columns, just describe the expected shape in the migration's comments and leave the generated files untouched.

Keep database relationships and table names aligned with the generated `Database` type. Do not silently invent columns, tables, or enum values.

## State and Auth

Use the existing Pinia user store and composables before adding new global state. Role/assignment rules (`admin`, `editor`, `maker`, `designer`) are centralized in `app/utils/permissions.ts` (`canManageAssignment`, `canManageAnyAssignment`) and reused by both the client (`userStore.isEditable()`, `userStore.isModerator`) and server (`server/utils/admin.ts`). Do not reimplement role branching inline; extend or call the shared utility instead. Keep `app/middleware/auth.ts`, `app/middleware/admin.ts`, and server-side authorization checks aligned. Form components that need to know whether the current user is staff should read `useUserStore().isModerator` directly instead of accepting a `moderator` prop threaded down from the page — the prop is redundant since every call site already sourced it from the same store, and skipping it removes a layer of prop-drilling.

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
