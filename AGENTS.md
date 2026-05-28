# SatoriOps — Security First Instructions

SatoriOps is a self-hosted collaboration platform for cybersecurity conference operations.

Security is a core requirement.

## Non-negotiable rules

- Never trust the client.
- Every read/write must be authorized server-side.
- Every mutation must validate input with zod.
- Every sensitive action must create an audit log.
- Do not expose stack traces or internal errors to users.
- Do not commit secrets.
- Do not add public registration by default.
- Default onboarding is invite-only.
- Use least privilege everywhere.
- Prefer simple, reviewable security over clever abstractions.

## Required security features

- RBAC
- audit logs
- invitation-based access
- secure sessions
- rate limiting
- input validation
- safe error handling
- environment validation
- Docker hardening
- backup and restore documentation

## Roles

OWNER:
- full organization control
- manage users
- manage settings
- delete events
- view audit logs

ORGANIZER:
- manage events, topics, tasks, decisions
- invite contributors/viewers
- view audit logs except security-sensitive entries

CONTRIBUTOR:
- create/update assigned topics and tasks
- comment
- create proposed decisions

VIEWER:
- read-only access

## Forbidden in MVP

- public signup
- anonymous access
- file uploads
- complex plugin system
- arbitrary HTML rendering
- external SaaS dependency unless approved
- AI features