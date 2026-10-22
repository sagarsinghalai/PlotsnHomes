# Phase B — Multi-Tenant Isolation: Staged Implementation Plan

**Goal:** turn the single-tenant CRM into a true multi-tenant SaaS where each company (tenant) sees only its own data — enforced server-side, not by hiding things in the UI. Builds on `ARCHITECTURE_AUDIT.md` and `PHASE_A_SECURITY_AUDIT.md`.

**Guiding rules**
- `Organization` is the **tenant root** (it already is, de-facto: `User.tenantId → Organization`).
- Isolation is enforced in a **central data-access layer**, not scattered `where` clauses.
- Every change is **additive and reversible**; we never enable enforcement until attribution is verified.
- Nothing deploys to production and no destructive DB op runs without your explicit go-ahead.

---

## Decisions needed before we start (gating)
| # | Decision | Why it matters | Recommended default |
|---|---|---|---|
| **D1** | **Is the current dev/prod data one company, or several?** | Determines whether backfill is trivial (wrap all in one org) or needs careful attribution + quarantine | **You answer.** If it's all your own seed/demo data → treat as **one** tenant |
| **D2** | Reuse `Organization` as tenant root vs add a separate `Tenant` model | Shapes every foreign key | **Reuse `Organization`** |
| **D3** | Can one user belong to **multiple** tenants at launch? | If no, `User.tenantId` is enough; if yes we need `TenantMembership` | **No at launch** → defer `TenantMembership` |
| **D4** | Per-tenant uniqueness for `Property.slug`, `*.code`, `Developer.name` | Two tenants may want the same slug/name | **Tenant-scoped uniqueness** |
| **D5** | What happens to the **global settings you already have** (lead channels, WhatsApp number/bot, campaign templates, rates) | They're currently shared by all tenants | **Make them per-tenant** in B6 |

> The only true blocker is **D1**. The rest have safe defaults and can be confirmed as we go.

---

## The sub-phases (each is small, reviewable, and independently shippable)

### B1 — Tenant context in the session *(no schema/data changes — safest first step)*
**Objective:** every authenticated request knows its tenant, server-side.
- Add `tenantId` (+ role) to the NextAuth JWT and session (`src/lib/auth-options.ts`, `src/types/next-auth.d.ts`), resolved from the user's `Organization`. Never trust a client-supplied tenant id.
- New `src/lib/tenant.ts` resolver: returns the current tenant from the authenticated principal (and later, from a verified custom-domain host).
- Refactor `requireAdminApi`/`requireCrmApi`/`crm-access.ts` to return the tenant principal; make `leadScopeForUser` **tenant-first** (tenant filter always applied; role scope *within* the tenant). Remove the `return {}` "all tenants" branch.
- Keep a `requirePlatform()` boundary (SUPERADMIN/PLATFORM_ADMIN) separate from tenant admins — the platform console + impersonation already built fit here.
- **Acceptance:** session exposes `tenantId`; a manager role no longer yields an empty (all-tenants) lead filter. **Tests:** session shape; negative test that a non-owner can't widen scope. **Rollback:** feature flag.

### B2 — Additive `tenantId` columns + dry-run attribution *(schema add, no enforcement)*
**Objective:** give tenant-owned rows an owner column and *see* how data would be attributed — without changing behaviour.
- Add **nullable** `tenantId` (indexed) to tenant-owned models: `Lead, Property, Project, Developer, Inquiry, Transaction, LeadActivity, LeadTask, AgentCommission, BrokerageInvoice, CrmGoal, BulkJob, InboundLeadLog, MessageLog, EmailLog, MeetingInvite, PropertyShowing, KycProfile, LoanApplication, UserActivity, WhatsAppCampaign`; denormalize `tenantId` onto `Franchise/Branch/Department/Team`. (`prisma db push` on dev; migration for prod later.)
- New **read-only** `scripts/attribute-tenants-dryrun.mjs`: for each model, resolve the candidate tenant from the owning user (`Lead.owner`, `Property.agent`, …) and report **resolved / ambiguous / orphaned** counts + sanitized ids — **never prints PII**.
- **Acceptance:** dry-run report produced; columns exist, all null. **Tests:** dry-run on a DB copy. **Rollback:** columns are nullable; drop if needed.

### B3 — Backfill attribution *(data change — with backup)*
**Objective:** populate `tenantId` safely.
- Back up the DB. Backfill **only resolved** rows (derive from the owning user's tenant). Route **ambiguous/orphaned** rows to a quarantine report for your decision — **never auto-assign**.
- Validate: every tenant row has a `tenantId`; no row references a parent in another tenant; pre/post counts match.
- **Acceptance:** 0 unresolved tenant rows (or all triaged). **Rollback:** restore from backup; columns stay nullable until B5.

### B4 — Central tenant-aware data-access layer + critical paths
**Objective:** one choke point that always injects `tenantId`.
- New `src/lib/data-access.ts`: a thin Prisma wrapper (`forTenant(tenantId)`) that **always** injects `tenantId` into `where` for tenant models and rejects queries with no tenant principal.
- Route the **critical** read/write paths through it first: leads, properties, projects, inquiries (APIs **and** the server-rendered `/admin` pages for those).
- **Acceptance:** those features are tenant-scoped. **Tests (the release gate):** **negative cross-tenant** — a user of Tenant A gets 403/404 reading/updating/deleting/exporting a record of Tenant B, by id, by list, and via the server page.

### B5 — Isolate everything else + flip enforcement
**Objective:** no path escapes tenant scope.
- Apply the data-access layer to the remaining admin APIs, the **63 server pages** that query Prisma directly, exports (`platform/export-*`), uploads (per-tenant file tagging), dashboards and reports.
- Flip enforcement: tenant principal **required**; make `tenantId` **non-null** last.
- **Acceptance:** isolation test suite green across all features. **Rollback:** per-module flags.

### B6 — Per-tenant settings & integrations *(makes your new features tenant-aware)*
**Objective:** each tenant has its own config, not a shared global.
- Split the global `SystemSetting` store: keep platform-global settings, add **`TenantSetting`** (`tenantId,key,value`). Migrate per-tenant config: **lead channels, the WhatsApp business number/credentials, the WhatsApp bot flows, campaign templates, pipelines, rates**.
- Per-tenant **integration connections** (the WhatsApp/Meta/Google credentials become per-tenant, encrypted — reuse the Phase-1 crypto).
- The inbound WhatsApp webhook resolves the tenant from the connection/number.
- **Acceptance:** Tenant A's WhatsApp number/bot/channels never used by Tenant B. **Tests:** per-tenant integration isolation.

### B7 — Tenant lifecycle & platform control plane
**Objective:** you can run tenants safely.
- Tenant states: `PENDING → ACTIVE → PAST_DUE → SUSPENDED → CANCELLED → (retention) → DELETED`, each **audited** (`AuditEvent` already exists).
- Suspend disables login/API/jobs/integrations but **preserves data**. Extend the existing platform console (users directory + impersonation already built) with tenant management.
- **Acceptance:** lifecycle transitions auditable; suspension doesn't disrupt other tenants.

### B8 — Security & regression gate
**Objective:** prove isolation before any launch.
- Full suite incl. **negative cross-tenant** tests for every entity, authz tests, webhook/integration isolation, migration validation (SQLite + MySQL parity). This is the **release gate**.

---

## Order & dependencies
`B1 → B2 → B3 → B4 → B5` are strictly sequential (the isolation foundation). **B6** (per-tenant settings/integrations) can start after B4. **B7** after B5. **B8** runs throughout and gates launch.

**Launch-blocking:** B1–B5, B6 (at least for WhatsApp/lead channels), B8. **B7** is required for you to operate tenants but can trail slightly.

## What I will NOT do without separate approval
Apply migrations to production, run destructive DB ops, deploy, push, or enable enforcement before attribution is verified.

## Recommended first move
**Start with B1** — it's small, changes no schema or data, is fully testable, and immediately closes the worst finding (manager roles currently see *all* tenants' leads). It also tees up everything else.
