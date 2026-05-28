# SatoriOps

SatoriOps is a security-first self-hosted collaboration platform for organizing cybersecurity conferences.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui patterns
- Auth.js
- Prisma ORM
- SQLite at `/data/satoriops.sqlite`
- Docker Compose

## Security principles

- No public signup
- Invitation-only onboarding
- Server-side authorization for sensitive reads and mutations
- Input validation with zod
- Audit logs for sensitive actions
- Safe error handling
- Least privilege by default

## Project layout

- `apps/web`: main web application
- `apps/web/prisma`: Prisma schema and seed logic
- `apps/web/app`: Next.js App Router
- `skills`: project operating skills

## Local development

1. Copy `.env.example` to `.env`.
2. Install dependencies in `apps/web`.
3. Generate Prisma client.
4. Apply the committed migrations to a local workspace database file.
5. Bootstrap the first owner.
6. Seed the demo data.
7. Start the app.

Example:

```powershell
Copy-Item .env.example .env
cd apps/web
npm install
npm run prisma:generate
$env:DATABASE_URL='file:../../../data/satoriops.sqlite'
npx prisma db execute --file prisma/migrations/20260527165000_init/migration.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied 20260527165000_init
npx prisma db execute --file prisma/migrations/20260527173000_add_password_hash/migration.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied 20260527173000_add_password_hash
npm run bootstrap:owner -- --email=owner@example.com --password=ChangeMe123456! --name="Initial Owner"
npm run prisma:seed
npm run dev
```

Notes:

- The canonical deployment database path is `/data/satoriops.sqlite`.
- For host-native local verification in this repository, the documented example uses `satoriops/data/satoriops.sqlite`.
- Public registration is intentionally absent. Access begins with the bootstrap owner and invitation flow.

## Docker

1. Copy `.env.example` to `.env` and set `AUTH_SECRET`.
2. Ensure the Docker daemon is running.
3. Build and start the stack.

```powershell
Copy-Item .env.example .env
docker compose up --build
```

This starts the app on [http://localhost:3000](http://localhost:3000) and mounts a persistent Docker volume at `/data`.

The container starts with:

- non-root user
- `read_only` root filesystem
- dropped Linux capabilities
- `no-new-privileges`
- Prisma `migrate deploy` before app start

## Bootstrap and onboarding

- First owner: `npm run bootstrap:owner -- --email=owner@example.com --password=ChangeMe123456! --name="Initial Owner"`
- Login: `/login`
- Invitation acceptance: generated from `/invitations`
- GitHub OAuth is available only when `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are configured, and only for already provisioned users.

## Backup and restore

- Backup: [`scripts/backup-sqlite.sh`](C:/Users/jdarkness/Documents/SatoriProject/satoriops/scripts/backup-sqlite.sh)
- Restore: [`scripts/restore-sqlite.sh`](C:/Users/jdarkness/Documents/SatoriProject/satoriops/scripts/restore-sqlite.sh)

Backup behavior:

- Uses `sqlite3 .backup` inside the running container for a consistent SQLite snapshot.
- Writes snapshot files under `backups/`.

Restore behavior:

- Stops the app container first.
- Replaces `/data/satoriops.sqlite`.
- Runs `PRAGMA integrity_check`.
- Starts the app again.

## Current status

Current MVP includes:

- Next.js App Router scaffold
- Prisma schema and committed migrations
- SQLite-backed auth with invitation onboarding
- RBAC helper layer
- audit logs
- dashboard, events, topics, tasks, blockers, decisions, people, invitations, audit logs and settings pages
- Docker deployment files
