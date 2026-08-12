# CMS Migration

This branch migrates the site content source from Notion to a managed database and adds an authenticated administration area.

## Safety boundary

- The production main branch remains unchanged during migration.
- Secrets and environment variable values must remain outside the repository.
- The old Notion-backed site remains available until the replacement is verified.

## Planned stages

1. Define the content schema and migration mapping.
2. Add database access and authentication foundations.
3. Import and reconcile Notion content and media.
4. Replace frontend queries incrementally.
5. Add the admin CRUD interface.
6. Verify the preview deployment before production cutover.
