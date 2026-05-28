# Security-First Agentic Engineering Skill

Use this skill for ANY software engineering, automation, agentic system, AI-assisted workflow, infrastructure platform, operational tool, or collaborative application.

This skill is organization-wide.

Security is NOT a later hardening phase.
Security is a system property.
Operational resilience is a system property.
Auditability is a system property.

This skill applies to:
- web applications
- APIs
- agentic systems
- AI workflows
- automations
- infrastructure tooling
- internal platforms
- operational dashboards
- collaborative systems
- integrations
- orchestration systems
- CI/CD tooling
- data pipelines

---

# Core Philosophy

Assume:
- attackers exist
- credentials leak
- insiders may become malicious
- users make mistakes
- prompts may be adversarial
- dependencies may become compromised
- operational chaos is inevitable
- systems fail
- recovery matters

Design for:
- least privilege
- explicit trust boundaries
- auditability
- recoverability
- maintainability
- operational resilience
- secure defaults
- adversarial thinking
- observability
- graceful degradation

Security is a design constraint, not an optional enhancement.

---

# Mandatory Workflow

Before implementing ANY feature:

1. Identify assets
2. Identify actors
3. Identify trust boundaries
4. Identify attack surfaces
5. Identify abuse cases
6. Define authorization model
7. Define validation model
8. Define logging requirements
9. Define audit requirements
10. Define recovery strategy
11. Define operational failure behavior
12. Define monitoring/observability requirements

Do NOT implement feature code before this process is complete.

---

# Required Output Format

For every feature/system/component produce:

## Feature

Short description.

## Assets

What resources or data are affected?

Examples:
- credentials
- API tokens
- user data
- operational metadata
- prompts
- embeddings
- audit logs
- infrastructure secrets
- orchestration state
- workflow state
- financial data
- deployment configs

## Actors

Who interacts with the system?

Examples:
- anonymous user
- authenticated user
- operator
- administrator
- automation agent
- AI agent
- external API
- CI/CD system
- infrastructure component

## Trust Boundaries

Explicitly identify:
- browser ↔ backend
- agent ↔ tool
- authenticated ↔ unauthenticated
- service ↔ database
- service ↔ filesystem
- service ↔ third-party API
- internal ↔ external systems
- trusted ↔ untrusted prompts
- orchestration ↔ execution layer

Define:
- trusted inputs
- untrusted inputs
- privilege escalation opportunities

---

# Threat Modeling

For every feature/system identify:

## Abuse Cases

- privilege escalation
- prompt injection
- data exfiltration
- lateral movement
- social engineering
- workflow poisoning
- orchestration abuse
- token leakage
- secret exposure
- spam/DoS
- race conditions
- insider abuse
- audit-log evasion
- unsafe automation chains
- dependency compromise
- supply-chain abuse
- unsafe agent autonomy
- unsafe retries/loops
- resource exhaustion

Assume adversarial interaction.

---

# Authorization Rules

Authorization MUST:
- be server-side
- be explicit
- deny by default
- be reviewable
- avoid hidden privilege transitions

Never trust:
- client-side authorization
- frontend state
- LLM reasoning alone
- implicit permissions

Agentic systems MUST:
- enforce execution boundaries
- validate tool permissions
- constrain action scope
- restrict autonomous escalation

---

# Validation Rules

Validate:
- all external inputs
- prompts
- uploaded data
- tool responses
- environment variables
- API payloads
- webhook payloads

Use:
- schema validation
- normalization
- sanitization
- strict typing
- allowlists where appropriate

Reject invalid input early.

---

# Logging Policy

Never log:
- passwords
- tokens
- secrets
- cookies
- session identifiers
- OAuth credentials
- API keys
- invitation secrets
- sensitive prompt contents unless explicitly approved

Logs must:
- support incident investigation
- include timestamps
- include actor identity
- include action metadata
- avoid sensitive leakage

Production logs must not expose stack traces publicly.

---

# Auditability

Sensitive actions MUST create immutable audit events.

Audit events should include:
- actor
- action
- timestamp
- target resource
- old/new values when relevant
- execution result

Audit logs must:
- resist tampering
- support incident review
- support rollback analysis

---

# AI / Agentic System Rules

AI systems MUST:
- assume prompts may be malicious
- isolate tool execution
- constrain capabilities
- avoid unrestricted autonomy
- require explicit approval for destructive actions
- avoid hidden memory persistence
- support execution tracing
- support human override
- support kill-switch mechanisms

Never allow:
- unrestricted filesystem access
- unrestricted shell access
- unrestricted network access
- self-modifying production behavior
- autonomous credential handling without constraints

Agent outputs are UNTRUSTED until validated.

---

# Secrets Management

- never commit secrets
- separate environments
- rotate credentials
- validate environment variables at startup
- minimize secret scope
- avoid long-lived credentials
- support revocation
- prefer ephemeral credentials where possible

---

# Dependency Policy

Prefer:
- mature dependencies
- actively maintained libraries
- minimal dependency count
- transparent OSS tooling

Avoid:
- abandoned packages
- unnecessary wrappers
- opaque SDKs
- dependency bloat
- unnecessary runtime plugins

Every dependency increases attack surface.

---

# Infrastructure Rules

Infrastructure MUST:
- use least privilege
- minimize exposed surfaces
- isolate workloads
- support backups
- support disaster recovery
- support observability
- support incident response

Prefer:
- simple deploys
- reproducible environments
- deterministic builds
- infrastructure-as-code where appropriate

Avoid:
- unnecessary complexity
- premature microservices
- architecture overengineering

---

# Container Security

Containers should:
- avoid root where practical
- use minimal base images
- expose minimal ports
- isolate secrets
- minimize privileges
- support immutable deployments

Never expose internal databases directly.

---

# Data Classification

Classify all data:

## PUBLIC
Safe for broad exposure.

## INTERNAL
Operational/internal data.

## SENSITIVE
Restricted operational data.

## SECURITY-SENSITIVE
Data impacting security posture.

Examples:
- prompts → potentially sensitive
- audit logs → security-sensitive
- credentials → security-sensitive
- infrastructure configs → sensitive
- orchestration metadata → sensitive

Security-sensitive data requires:
- stricter access control
- auditability
- careful logging behavior

---

# Secure UX Principles

Security controls must be understandable.

Avoid:
- hidden privilege transitions
- ambiguous destructive actions
- invisible automation behavior
- unclear AI actions

Require:
- explicit confirmation
- ownership visibility
- execution traceability
- permission visibility
- audit visibility where appropriate

---

# Observability Requirements

Systems must support:
- metrics
- health checks
- structured logging
- audit review
- incident investigation
- tracing where useful

Operational visibility is mandatory.

---

# Failure Behavior

Systems must:
- fail securely
- degrade gracefully
- avoid silent corruption
- avoid unsafe retries
- avoid infinite automation loops

Define:
- fallback behavior
- retry behavior
- timeout behavior
- escalation behavior
- rollback behavior

---

# Recovery-First Philosophy

Assume:
- systems fail
- humans fail
- agents fail
- infrastructure fails
- compromise happens

Systems MUST support:
- backup restore
- rollback
- disaster recovery
- incident investigation
- operational recovery
- kill-switches
- manual override

Recovery capability matters more than theoretical perfection.

---

# Forbidden Unless Explicitly Approved

- public admin endpoints
- hidden backdoors
- unrestricted shell execution
- unrestricted agent autonomy
- eval/dynamic execution
- unsafe markdown rendering
- unrestricted uploads
- client-side-only authorization
- production secrets in code
- self-modifying production agents
- hidden memory persistence
- opaque autonomous workflows

---

# Engineering Principles

Prefer:
- boring code
- readable code
- explicit code
- reviewable code
- deterministic behavior
- maintainable systems

Avoid:
- magic abstractions
- hidden side effects
- unnecessary complexity
- architecture astronautics
- overengineered frameworks

The goal is resilient engineering, not impressive complexity.