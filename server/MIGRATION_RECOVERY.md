# Failed Migration Recovery

## Background

Migration `20260712174637_add_portfolio_description_project_tags_services` failed in production with:

```
column "description" of relation "portfolios" already exists
```

This happened because the database schema was already updated manually (or via a prior deployment) before Prisma's migration journal was updated. Prisma now reports `P3009: migrate found failed migrations in the target database`, which blocks further migrations.

## Root Cause

The columns and schema changes required by this migration **already exist** in the PostgreSQL database:

- `portfolios.description` — present
- `projects.tags` — present
- `projects.services` — present
- `media_settings` DEFAULT removals — applied

The `_prisma_migrations` table, however, still records this migration as failed/incomplete.

## Resolution

Run the recovery script to mark the migration as successfully applied:

```bash
cd server
node scripts/fixFailedMigration.js
```

This executes:

```sql
UPDATE "_prisma_migrations"
SET finished_at = NOW(),
    rolled_back_at = NULL,
    logs = NULL
WHERE migration_name = '20260712174637_add_portfolio_description_project_tags_services';
```

**Do not delete the migration row** — Prisma needs it to know the migration was applied. Do not re-run `prisma migrate deploy` for this migration.

## Critical: No Automatic Migrations at Startup

Future deployments must **never** automatically execute migrations during server startup. Migrations are a deployment-time concern, not a runtime concern.

### Allowed at startup
- `prisma generate` (regenerate Prisma Client)
- Application server start (`node src/index.js`)

### Forbidden at startup
- `prisma migrate deploy`
- `prisma migrate dev`
- `prisma db push`

### Verified startup commands

**Root `package.json`:**
```json
"start": "cd server && npm start"
```

**Server `package.json`:**
```json
"start": "npx prisma generate && node src/index.js"
```

**Dockerfile:**
```dockerfile
CMD ["node", "src/index.js"]
```

## Schema Verification

The Prisma schema (`prisma/schema.prisma`) already matches the actual PostgreSQL schema. Verified fields:

| Model | Field | Status |
|-------|-------|--------|
| Portfolio | `title` | present |
| Portfolio | `description` | present |
| Portfolio | `category` | present |
| Portfolio | `imageUrl` | present |
| Portfolio | `mediaSettings` | present |
| Project | `tags` | present |
| Project | `services` | present |

Note: `projectTags` and `services` are **Project** fields, not Portfolio fields. The migration added `tags` and `services` to the `projects` table and `description` to the `portfolios` table.

## Data Safety

- No portfolio data was deleted during this fix.
- Existing Cloudinary assets (images, videos) remain untouched.
- The `contentController.js` workaround that stripped `description` from portfolio create payloads has been removed so the field is now persisted correctly.
