# Backend Skill

Use this skill for database, Prisma, API routes, auth, permissions, and server logic.

## Rules

- Use Prisma migrations.
- Validate input with zod.
- Never trust client-side authorization.
- Keep permissions simple:
  - owner
  - organizer
  - contributor
  - viewer
- Add audit logs for important changes:
  - topic status changes
  - task ownership changes
  - decision creation
  - deletion
  - role changes

## Required output

When changing backend logic:
- explain schema changes
- create/update migration
- update seed if useful
- add basic tests where practical
