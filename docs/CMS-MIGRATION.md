# CMS Migration

This branch migrates the site content source from Notion to a managed database and adds an authenticated administration area.

## Safety boundary

- The production `main` branch remains unchanged during migration.
- Secrets and environment variable values must remain outside the repository.
- The old Notion-backed site remains available until the replacement is verified.
- The migration keeps the original Notion page IDs in `legacy_id` or metadata for reconciliation.

## Implemented on `cms-migration`

1. Supabase schema and RLS policies for pages, sections, items, courses, expertise, activities, comments, media, and admin profiles.
2. Notion-to-Supabase field and relation mapping.
3. Supabase server/browser clients and a content-query layer compatible with the existing frontend data shape.
4. Public pages switched from the Notion adapter to the Supabase adapter.
5. Supabase Email/Password admin login, session middleware, page management, section creation, item creation, and publish toggles.

## Remaining gates

1. Generate and commit a synchronized `package-lock.json` after the Supabase dependency installation.
2. Create or connect the Supabase project, apply the migration, create the first Auth user, and insert that user into `admin_profiles`.
3. Run the one-time Notion export/import utility, including media download and Storage upload verification.
4. Configure Vercel environment variables and create the separate Project `tech-literacy2` under the correct Vercel account/team.
5. Run build, preview, browser, data-count, relation, and image checks before any production cutover.

## Required environment variables

See `.env.example`. Do not commit actual values.
