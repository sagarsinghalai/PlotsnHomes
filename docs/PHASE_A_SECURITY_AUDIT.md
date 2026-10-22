# Phase A — Security, Tenant-Isolation & Data-Access Audit

**Continues `ARCHITECTURE_AUDIT.md`. The audit itself was read-only; a follow-up auth-only hotfix (below) was then applied with approval.**

---

## ✅ Remediation applied (auth-only hotfix — committed locally, not pushed)
Approved scope: add authentication/authorization to the live, pre-tenancy holes. **No schema, multi-tenancy, or data changes.** Verified: `npx tsc --noEmit` clean; `npm test` 21/21 pass.

| Finding | Route(s) | Fix |
|---|---|---|
| S-1 | `admin/commissions/payout` | now requires staff (`requireCrmApi`) |
| S-6 | `admin/commissions/notes`, `admin/categories` (POST/PUT/DELETE — GET stays public for the storefront), `admin/reports/overview`, `admin/analytics`, `admin/price-history` (GET+POST), `admin/templates`, `admin/variables` | now require staff (`requireCrmApi`) |
| S-6 | `admin/form-registrations` (mints `WHITE_LABEL_ADMIN`/`SELLER` users), `admin/white-label` | now require **platform owner** (`isSuperAdmin`) |
| S-6 | `admin/webpage-editor/{footer,nav,pages}` mutations | upgraded from any-logged-in-user to staff (`requireCrmApi`); GET stays public for site rendering |
| S-7 | `webhooks/whatsapp` | GET now checks `hub.verify_token`; POST verifies `X-Hub-Signature-256` HMAC over raw body + size guard; **fails closed in production** when `WHATSAPP_APP_SECRET`/verify token unset |
| S-8 | `webhooks/stripe` | **fails closed in production** when `STRIPE_WEBHOOK_SECRET` is unset (was parsing unverified) |
| S-11 | `admin/parse-maps-url` | now requires staff + replaced the bypassable `url.includes("goo.gl")` SSRF check with a **hostname allowlist** |

**New env vars (optional in dev, required in prod):** `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` (documented in `.env.example`).

## ✅ Follow-up 2 — Plaintext-password removal + platform-owner console (committed locally)
Approved by the owner ("all in one"). Verified: `prisma db push` applied to dev, `npx tsc --noEmit` clean, `npm test` 21/21, and a throwaway harness verified the impersonation engine (10/10) against the dev DB.

**S-2 plaintext passwords — FIXED.** Dropped `User.displayPassword` (schema + regenerated MySQL schema; dev `db push` removed the 2 demo values). Removed every plaintext write (`users/bulk`, `form-registrations` incl. the persisted `generatedPassword`, admin password reset, self-service reset). The reveal endpoint `GET users/[id]/password` now returns account info only (no password); `passwords/csv` is deprecated (410, still SUPERADMIN-gated); the client-side plaintext logger is no longer used server-side. Authentication is unaffected (bcrypt `passwordHash` only); one-time passwords are still shown at creation/reset, just never stored.

**Platform-owner console — ADDED** (SUPERADMIN/PLATFORM_ADMIN only):
- `src/lib/platform-access.ts` `requirePlatformApi()` (true platform gate — `isSuperAdmin`, unlike `requireAdminApi` which admits buyers/sellers).
- `GET /api/admin/platform/users` — every user across all white-labels, franchises, branches, departments, teams (metadata only, no passwords).
- **Audited impersonation ("Login as user")** — password-free, driven via NextAuth `session.update()`; the `jwt` callback (in `auth-options.ts`) enforces that only a platform owner can start it, refuses to impersonate another platform admin or an inactive user, retains the real owner's identity underneath, and writes `AuditEvent` rows (new model) on start/stop. A persistent `ImpersonationBanner` (mounted in `providers.tsx`) shows "Viewing as … — Exit" everywhere and exits via `update({ stopImpersonation: true })`.
- **Reset password** from the console (and the existing user editor) — now `requireCrmApi` (was `requireAdminApi` which admitted customers); returns the new temp password once, stores only the hash, writes a `PASSWORD_RESET` audit event.
- UI: `/admin/platform/users` page + `platform-users-client.tsx` (grouped by white-label, search, Login-as + Reset), plus a sidebar link.

### ✅ NEW criticals discovered during this work — NOW FIXED (committed locally)
- **N-1 Account takeover via `auth/reset-password` — FIXED.** It now requires a valid, unexpired, **single-use** token (not just an email). Verified E2E (9/9): no-token rejected, wrong token rejected, valid token resets, token cannot be reused.
- **N-2 `auth/forgot-password` secret leak — FIXED.** It no longer returns the `resetUrl`/`otpCode`. It issues a token, stores only its **SHA-256 hash** (new `PasswordResetToken` model, 1-hour expiry), and **emails the link** (logged to EmailLog in dev). A `devResetUrl` is returned **only when NODE_ENV !== production** for local testing. Generic anti-enumeration response in all cases.
- Frontend updated: the reset page carries the token from the emailed link; the forgot page shows "check your email" (plus a dev-only link) instead of an on-screen OTP.

**Still deliberately NOT changed (need your decision — see Deliverable 10):**
- **`whatsapp/send`** — called from the **public** property page (`property-actions.tsx`) as an intended visitor "share via WhatsApp" feature; requiring auth would break it. Needs rate-limiting / a product decision, not an auth gate.
- **`telephony/*`, `webhooks/{telegram,twilio-sms}`** — need provider-signature validation (Twilio/Telegram); adding naive auth could break those callbacks.
- **S-3/S-4/S-5/S-9/S-13** (tenant isolation, session tenant, global settings, cross-tenant IDOR, unscoped server pages) — the core multi-tenancy work, intentionally deferred to Phase B+.

*Caller-safety note:* every guarded GET was checked against its callers first; `admin/categories` GET is consumed by public components (`property/wp-hero-search.tsx`, `dashboard/list-property-form.tsx`) so only its mutations were guarded. `whatsapp/send` public usage is why it was excluded.

---

**The audit below reflects the pre-hotfix state; the table above records what has since been remediated.**

## Methodology & coverage (honest scope)
- **Structural extraction across ALL 123 API routes** (verified from code): HTTP methods, auth helper used, Prisma models/operations, and IDOR/ownership signals (`where:{id}` + `params.*` vs. `ownerId/userId/tenantId/...`). Every route is classified below.
- **Fully read end-to-end (this pass):** `prisma/schema.prisma`, `src/lib/roles.ts`, `src/middleware.ts`, `src/lib/crm-access.ts`, `src/lib/admin-api.ts`, `src/lib/auth-options.ts`, `src/lib/system-settings.ts`, Phase 1/1.1 security libs, and these handlers/pages: `admin/passwords/csv`, `admin/commissions/payout`, `admin/organization`, `admin/categories`, `admin/white-label`, `admin/reports/overview`, `admin/leads/[id]`, `webhooks/razorpay`, `webhooks/stripe`, `webhooks/whatsapp`, `upload`, `partners/white-label`, `src/app/admin/layout.tsx`, `src/app/admin/leads/page.tsx`.
- **Classified by extraction but not each read line-by-line:** the remaining ~105 handlers and the other 62 server pages. Where a row says *[extracted]* it is characterized from the structured signals, not a full read. A full line-by-line read of every remaining handler is itemized as residual work.
- Labels: **[VERIFIED]** read in code · **[EXTRACTED]** from structured signals · **[ASSUMPTION]** · **[UNKNOWN]**.

---

## Deliverable 1 — Route-by-route audit

**Auth model (verified):** `/admin/**` **pages** are gated by `requireAdmin()` + per-route `hasPermission()` in `src/app/admin/layout.tsx` — **not** by `middleware.ts` (which only sets an `x-pathname` header, `src/middleware.ts`). **API routes** are gated individually; there is no blanket API guard. So an `/api/admin/**` route with no in-handler auth is **reachable without a session** even though the matching admin *page* is protected.

### Tier 1 — Unauthenticated or under-protected (fix before anything else)
| Route | Methods | Auth (verified) | Data / effect | Severity | Remediation |
|---|---|---|---|---|---|
| `admin/commissions/payout` | POST | **NONE** [VERIFIED] | Creates `Transaction type=COMMISSION_PAYOUT status=COMPLETED` for an arbitrary `agentId`; marks `AgentCommission` paid | **Critical** | Require admin/finance role + tenant; validate ownership of commission; audit. |
| `admin/commissions/notes` | POST | **NONE** [EXTRACTED] | `agentCommission.update` (writes notes) by id | **High** | Require role + tenant-scoped record check. |
| `admin/categories` | GET/POST/PUT/DELETE | **NONE** [VERIFIED] | Full CRUD on `PropertyCategory` + system dropdown options | **High** (integrity/defacement) | Require admin role; scope (global-with-tenant-overrides per J). |
| `admin/white-label` | GET/POST | **NONE** [VERIFIED] | Reads/writes white-label profile + partner subscriptions (`white-label-store`) | **High** | Require SUPERADMIN/platform; move to per-tenant branding store. |
| `admin/reports/overview` | GET | **NONE** [VERIFIED] | Returns **revenue by month** (sum of COMPLETED transactions), lead/user/inquiry counts | **High** (business-metrics disclosure) | Require admin role + tenant scoping. |
| `admin/price-history` | GET/POST | **NONE** [EXTRACTED] | `property.update`, `propertyPriceLog.create/createMany` | **High** | Require role + tenant-scoped property. |
| `admin/form-registrations` | GET/POST | **NONE** [EXTRACTED] | `user.create/update`, `messageLog.create` | **High** (creates users) | Require admin role; verify no privilege set. |
| `admin/templates` / `admin/variables` | GET/POST/DELETE | **NONE** [EXTRACTED] | message/template + variable stores | **Medium** | Require admin role. |
| `admin/webpage-editor/{footer,nav,pages}` | GET/POST/DELETE | **NONE** [EXTRACTED] | Public-site content store | **Medium/High** (site defacement) | Require admin role; per-tenant in white-label. |
| `admin/analytics` | GET | **NONE** [EXTRACTED] | Aggregates across `lead/property/project/transaction/user/...` | **High** (cross-data disclosure) | Require role + tenant scope. |
| `admin/parse-maps-url` | GET | **NONE** [EXTRACTED] | Fetches/parses an external URL | **Medium** (**SSRF**) | Require auth; allowlist hosts; block internal ranges. |
| `whatsapp/send` | GET/POST | **NONE** [EXTRACTED] | Sends WhatsApp messages | **High** (abuse/cost) | Require role; rate-limit. |
| `webhooks/whatsapp` | GET/POST | **NONE — no signature, no verify-token** [VERIFIED] | GET echoes `hub.challenge` for any `subscribe`; POST `receiveIncomingMessage()` (can create leads/messages) from any caller | **High** | Add verify-token on GET; HMAC signature on POST (reuse `meta-webhook.ts` pattern); tenant resolution. |
| `webhooks/stripe` | POST | signature **only if `STRIPE_WEBHOOK_SECRET` set; else parses unverified** [VERIFIED] | `completeTransaction()` | **High** (fail-open in prod) | Fail closed when secret missing in production (same fix as Meta). |
| `webhooks/{telegram,twilio-sms}` | POST/GET | **NONE** [EXTRACTED] | messaging ingress | **Medium** | Verify provider signatures; tenant resolution. |
| `telephony/{inbound,outbound-twiml,call-status-callback}` | POST/GET | **NONE** [EXTRACTED] | Twilio callbacks; create leads/messages | **Medium** | Validate Twilio signature; tenant resolution. |

### Tier 2 — Authenticated but role-only → **cross-tenant IDOR** once multi-tenant (systemic)
These call `requireAdminApi` (role check only, `src/lib/admin-api.ts`) or `requireCrmApi` and then `prisma.<model>.{findUnique|update|delete}({ where: { id } })` **with no tenant/owner filter**. Today any admin-panel role reaches any record regardless of organization; after multi-tenancy this is cross-tenant IDOR. **Evidence:** `admin/leads/[id]` [VERIFIED] guards via `getLeadIfAllowed`→`leadScopeForUser`, which returns `{}` for manager roles, so `findFirst({where:{id}})` reaches any lead.
`admin/properties/[id]`, `admin/properties/[id]/price-history`, `admin/projects/[id]`, `admin/developers/[id]`(+`/tasks`,`/tasks/[taskId]`), `admin/users/[id]`(+`/password`,`/activities`), `admin/transactions/[id]`, `admin/inquiries/[id]`, `admin/kyc/[id]`, `admin/loans/[id]`, `admin/showings/[id]`, `admin/billing/plans/[id]`, `admin/billing/subscriptions/[id]`, `admin/teams/[id]`, `admin/rating-slabs/[id]`, `admin/leads/tasks/[taskId]`, `admin/meetings`, `admin/messages`, `admin/commission`. **Remediation:** every one must resolve tenant server-side and filter `where:{ id, tenantId }` (or via the data-access layer in Deliverable 7). [EXTRACTED except `admin/leads/[id]` VERIFIED]

### Tier 3 — Authenticated list/create/aggregate, **no tenant scope** (cross-tenant read/write once multi-tenant)
`admin/leads` (GET list / POST create) [VERIFIED pattern], `admin/properties`, `admin/projects`, `admin/developers`, `admin/showings`, `admin/meetings`, `admin/messages`, `admin/messages/bulk`, `admin/kyc/[id]` (GET findMany all), `admin/loans/[id]` (findMany all), `admin/commission`, `admin/billing/{plans,subscriptions}`, `admin/org-hierarchy`, `admin/platform/{goals,pipeline,company,bhk}`, `admin/settings` (`property.updateMany` global!), `admin/loans/rates`, `admin/lead-channels`(+logs,test), `admin/analytics`, `admin/reports/overview`. **Remediation:** tenant filter on all reads/writes/aggregates. [EXTRACTED]

### Tier 4 — Data exports (no tenant scope) — highest breach impact
`admin/platform/export-leads` (`lead.findMany`→CSV + `bulkJob`), `admin/platform/export-showings` (`propertyShowing.findMany`), `admin/platform/export-tasks` (`leadTask.findMany`), `admin/passwords/csv` (**SUPERADMIN-gated** [VERIFIED] — exports password-history log incl. plaintext-ish `displayPassword` concept), `admin/platform/import-leads` (`lead.create`). **Remediation:** tenant-scope every export/import; keep `passwords/csv` platform-only and **remove plaintext password storage** (see Finding S-2). [EXTRACTED except passwords/csv VERIFIED]

### Tier 5 — Platform-owner operations (correctly SUPERADMIN-gated) — keep, separate from tenants
`admin/organization`(+`/bulk`) [VERIFIED `isSuperAdmin`], `admin/passwords/csv` [VERIFIED SUPERADMIN]. These are the nucleus of the platform control plane; must stay platform-only and **not** be exposed to tenant admins.

### Tier 6 — Intentionally public (verify safe; add tenant resolution + rate-limit)
`properties` (GET marketplace list — all properties), `public/pages/[slug]`, `settings/dropdowns`, `currency/rates`, `inquiries` (POST), `leads` (POST website capture), `showings` (POST), `kyc`, `loans`, `messages`, `properties/submit`, `partners/seller`, `partners/white-label` [VERIFIED intake form], `meetings/[token]` (token capability URL), `auth/*` (`register`, `forgot-password`, `reset-password`, `[...nextauth]`), `checkout/*` (session-gated), `integrations/leads/{meta,google,[channel]}` (Phase 1 signature/secret — **global config**, needs per-tenant), `webhooks/razorpay` [VERIFIED signature+idempotent]. **Remediation:** confirm each returns only intended public fields; in white-label, scope by verified domain→tenant; add rate-limiting.

### Correctly-scoped examples (good patterns to replicate)
`admin/leads/[id]` ownership guard via `getLeadIfAllowed` (role-scoped), `webhooks/razorpay` (signature + `status!==COMPLETED` idempotency), `upload` (session + media validation), `admin/readiness` (admin-gated, no secrets). The scoping concept exists in `crm-access.ts` — it is just **tenant-blind** and **inconsistently applied**.

---

## Deliverable 2 — Server-side data-access inventory
- **63 server pages/layouts import `@/lib/prisma` directly** [VERIFIED count] and query in the server component. `/admin/**` pages are behind `requireAdmin()`+`hasPermission()` (`src/app/admin/layout.tsx`) but the **queries themselves are unscoped**. **Evidence [VERIFIED]:** `src/app/admin/leads/page.tsx` runs `prisma.lead.findMany({ where: smartListWhere(...), take:500 })`, `prisma.lead.count()`, `prisma.user.findMany(all)`, `prisma.property.findMany(all)` — no owner/tenant filter. So `leadScopeForUser` (applied in the `admin/leads/[id]` API) is **bypassed in the server-rendered list page**.
- Shared stores that read/write **global `SystemSetting`** (no tenant): `system-settings.ts` (`getSetting/setSetting`), `lead-channels.ts`, `white-label-store`, `form-registrations-store`, `pipeline-store`, `pipeline-settings`, `field-privacy`, `password-history-logger`. All must become tenant-scoped or be confirmed platform-global by design.
- Files not each read: the other 62 pages and the lib stores' internals — itemized as residual work.

---

## Deliverable 3 — Tenant-isolation matrix
Status legend: **None** = no isolation; **Role** = role-scoped but tenant-blind; **N/A** = platform-global by design.

| Area | Current status | Evidence (file) | Severity | Required change |
|---|---|---|---|---|
| Leads & lead activities | **None/Role** (API role-scoped but `{}` for managers; pages unscoped) | `crm-access.ts` `leadScopeForUser`, `admin/leads/page.tsx` | Critical | `tenantId` on Lead/LeadActivity/LeadTask; tenant-first filter everywhere |
| Properties & price logs | **None** | `admin/properties/*`, `price-history` (no auth) | Critical | `tenantId` on Property/PropertyPriceLog |
| Projects & developers | **None** (no owner link at all) | `admin/projects/*`, `admin/developers/*` | Critical | `tenantId` on Project/Developer |
| Inquiries & transactions | **None** | `admin/inquiries/[id]`, `checkout/*`, `webhooks/*` | Critical | `tenantId`; payment flows tenant-tagged |
| Tasks/meetings/messages/email logs | **None** | `admin/meetings`, `admin/messages`, `messaging` lib | High | `tenantId` (or derive); scope message logs |
| Users & org hierarchy | **Partial** (`User.tenantId` exists; hierarchy unscoped) | schema, `admin/org-hierarchy` | Critical | Denormalize `tenantId` on Franchise/Branch/Dept/Team; scope membership |
| Commissions/invoices/loans/KYC | **None** (payout unauth) | `commissions/payout`, `loans/[id]`, `kyc/[id]`, `BrokerageInvoice` | Critical | `tenantId`; auth payout; scope KYC/loans |
| Dashboards/search/reports/exports | **None** | `reports/overview` (unauth), `platform/export-*` | Critical | Tenant-scope all aggregates & exports |
| Uploads/documents/attachments | **None** (session-only, public URLs) | `upload/route.ts` | High | Per-tenant storage path; access control for KYC/private docs |
| System settings & integrations | **None (global)** | `system-settings.ts`, `lead-channels.ts` | Critical | `TenantSetting` + per-tenant `IntegrationConnection` |
| Payment webhooks & subscriptions | **Partial** (Razorpay ok; Stripe fail-open; subs per-user) | `webhooks/razorpay`, `webhooks/stripe`, `UserSubscription` | High | Stripe fail-closed; tenant `Subscription` model |
| Notifications/background/scheduled | **N/A — none exist** (no queue/cron) | `package.json` (no deps) | Medium | Tenant-context in future job runner |
| Platform admin & support | **Role (SUPERADMIN)** correct nucleus | `admin/organization` | — | Formalize scoped, audited support access |

---

## Deliverable 4 — Prioritized security finding register
| ID | Finding | File / evidence | Sev | Blocks prod? |
|---|---|---|---|---|
| S-1 | **Unauthenticated financial write**: commission payout creates COMPLETED transactions for arbitrary `agentId` | `admin/commissions/payout/route.ts` (no auth) | **Critical** | Yes |
| S-2 | **Plaintext/display password storage + export**: `User.displayPassword` and a password-history logger exported via CSV | schema `displayPassword`; `admin/passwords/csv`, `password-history-logger` | **Critical** | Yes |
| S-3 | **No tenant isolation on business data**; `leadScopeForUser` returns `{}` for manager roles | `crm-access.ts` | **Critical** | Yes |
| S-4 | **Session lacks tenant**; JWT carries only `id`,`role` | `auth-options.ts` | **Critical** | Yes |
| S-5 | **Global integration credentials/settings** | `system-settings.ts`, `lead-channels.ts` | **Critical** | Yes |
| S-6 | **Unauthenticated admin writes/reads** (categories, white-label, reports/overview, price-history, form-registrations, templates, variables, webpage-editor, analytics, whatsapp/send) | listed Tier 1 | **High** | Yes |
| S-7 | **WhatsApp webhook unverified** (no verify-token, no HMAC) | `webhooks/whatsapp/route.ts` | **High** | Yes |
| S-8 | **Stripe webhook fail-open** when secret unset | `webhooks/stripe/route.ts` | **High** | Yes |
| S-9 | **Cross-tenant IDOR** on all role-only `[id]` routes | Tier 2 list | **High** | Yes |
| S-10 | **Unscoped exports** (leads/showings/tasks) | `admin/platform/export-*` | **High** | Yes |
| S-11 | **SSRF** via maps-url fetch (unauth) | `admin/parse-maps-url` | **Medium** | Investigate |
| S-12 | **Public uploads / no per-tenant file isolation** (KYC docs world-readable URLs) | `upload/route.ts` | **Medium/High** | Yes (for private docs) |
| S-13 | **Unscoped server-page queries** bypass role scope | `admin/leads/page.tsx` + 62 pages | **High** | Yes |
| S-14 | **Schema/migration drift**; `/icon` build failure (reproduced Phase 1.1) | `prisma/migrations`, `src/app/icon.tsx` | **Medium/High** | Yes (deploy) |
| S-15 | **No rate-limiting** on public intake/webhooks | `leads`,`inquiries`,`partners/*`,webhooks | **Medium** | No |

(Phase 1/1.1 controls — Meta webhook HMAC/size/timing-safe, credential encryption, key rotation, readiness gate — **verified present** and are not regressions.)

---

## Deliverable 5 — Models requiring **direct** `tenantId`
Lead, Property, Project, Developer, Inquiry, Transaction, AgentCommission, BrokerageInvoice, CrmGoal, BulkJob, InboundLeadLog, MessageLog, EmailLog, MeetingInvite, PropertyShowing, KycProfile, LoanApplication, LeadActivity, LeadTask, UserActivity. **Structure models** (Franchise/Branch/Department/Team) get a denormalized `tenantId` (= root Organization). **User** already has `tenantId`. *(Derivable children like ActivityComment, PropertyPriceLog, Favorite can inherit via parent, but high-traffic ones should carry it for fast purge/scoping.)*

## Deliverable 6 — Records whose ownership **cannot** be safely inferred
- **Project, Developer, PropertyCategory, RatingSlab, CustomFieldDef** — no user/org link; cannot be attributed from the row alone. Decide: platform-global vs per-tenant (J-6).
- **Leads with `ownerId = null`** (schema allows it) and **Inquiries/Showings created pre-assignment** — no owner to derive from.
- **SystemSetting** rows (global by design) — must be split deliberately, not auto-attributed.
- **Transactions** tied only to a `userId` buyer (not an org) — buyer may belong to no tenant.
- **Orphaned/cross-org** rows (e.g., a Property whose `agent.tenantId` differs from a linked Project) — conflicting signals.
**→ A read-only attribution dry-run must list these as resolved / ambiguous / orphaned with counts and sanitized ids; never auto-assign.**

---

## Deliverable 7 — Recommended central authorization & data-access design
1. **Tenant in the principal.** Put `tenantId` (+ role, memberships) into the NextAuth JWT/session (`auth-options.ts`), resolved from the user's `Organization`; for white-label hosts, resolve from a **verified** `CustomDomain` map, never the raw Host header.
2. **Single tenant-aware data-access layer** (`src/lib/data-access.ts`): a thin Prisma wrapper exposing `forTenant(tenantId)` that **always injects `tenantId`** into `where` for tenant models and rejects queries without a tenant principal. All API routes **and server components** go through it — no raw `prisma.<tenantModel>` in handlers/pages.
3. **Refactor `crm-access.ts`**: `requireCrmApi`/`requireAdminApi` return the tenant principal; `leadScopeForUser` becomes **tenant-first** (tenant filter always applied; role scope *within* the tenant). Remove the `{}`-returns-everything branch.
4. **Platform vs tenant boundary**: a separate `requirePlatform()` guard for SUPERADMIN/PLATFORM_ADMIN control-plane routes (`/api/platform/**`, organization CRUD). Tenant admins never get platform scope. Support access is explicitly scoped, time-boxed, and written to `AuditEvent`.
5. **Webhooks/jobs** carry an explicit `tenantId` resolved at ingress (from connection/path), never ambient.
6. **Fail closed**: missing tenant principal → 403; unknown host → reject.

## Deliverable 8 — Safe, staged implementation order
1. **Hotfix Tier-1 auth gaps** (S-1,S-6,S-7,S-8,S-11) — add auth/signature to the unauthenticated routes **now**; smallest change, no schema impact. *(Still requires your approval to edit code — this audit does not.)*
2. **Tenant principal in session** (S-4) + `requirePlatform()` boundary.
3. **Additive `tenantId` + dry-run attribution** (Deliverable 6) — no enforcement yet.
4. **Central data-access layer** (Deliverable 7) + refactor `crm-access.ts`.
5. **Apply scoping to all Tier 2/3/4 routes and the 63 server pages**; remove unscoped exports.
6. **Per-tenant settings + integration connections** (S-5); migrate `lead_channels`.
7. **Stripe fail-closed + webhook tenant resolution**; tenant `Subscription` model.
8. **Uploads per-tenant + private-doc access control** (S-12); remove plaintext passwords (S-2).
9. **Schema/migration reconciliation + `/icon` fix** (S-14) before staging deploy.

## Deliverable 9 — Required tests (incl. negative cross-tenant)
- **Negative cross-tenant (must-have):** user of Tenant A gets 403/404 reading/updating/deleting/exporting any Lead/Property/Project/Inquiry/Transaction/KYC/Upload of Tenant B — by id, by list, by export, by report, and via server pages.
- **Authz:** each Tier-1 route rejects anonymous; each Tier-2 `[id]` route rejects cross-tenant id; `requirePlatform` rejects tenant admins.
- **Session/resolver:** JWT carries `tenantId`; manager role no longer yields an empty (all-tenant) filter; unknown host rejected.
- **Webhook security:** WhatsApp/Stripe reject unverified in production; Meta suite (already green) stays green; idempotency on replays.
- **Integration isolation:** Tenant A's credentials never used for Tenant B; masked responses leak nothing.
- **Migration:** dry-run attribution counts stable; backfill idempotent; SQLite+MySQL parity.
- **Regression:** existing lead pipeline (dedupe/routing/scoring/notify) still works, now tenant-scoped.
- Runner: extend the existing `tsx` suite (`npm test`); add a tenant-isolation test module. Negative tests are the release gate.

## Deliverable 10 — Decisions requiring your approval
1. **Is the current data one company or several?** (determines whether attribution is trivial or must quarantine ambiguous rows) — **[UNKNOWN, needs your answer]**.
2. **Remove `displayPassword` / plaintext password logging?** (S-2) — strongly recommend yes; confirm nothing depends on it.
3. **Hotfix the Tier-1 unauthenticated routes immediately** vs. fold into Phase B — recommend an immediate minimal hotfix.
4. **Global vs per-tenant** for Project/Developer/PropertyCategory/RatingSlab/CustomFieldDef (J-6).
5. **Billing provider** for platform subscriptions (Razorpay already integrated).
6. **Custom-domain hosting reality on Hostinger** (affects host→tenant resolution).
7. **Keep `Organization` as tenant root** (recommended) and **defer `TenantMembership`** to v2 unless a user must belong to multiple tenants at launch.

---

### Residual (not fully read this pass)
~105 API handlers characterized by extraction (not line-by-line) and 62 server pages; lib store internals (`white-label-store`, `form-registrations-store`, `pipeline-store`, `messaging`, `password-history-logger`, `media-limits`). Recommend a full read of these during Phase-B step 1. The `/icon` failure was reproduced in Phase 1.1 (not re-run here).

*Read-only audit. Verify every [EXTRACTED]/[ASSUMPTION]/[UNKNOWN] before implementing. Do not treat this as a guarantee of completeness for the un-read handlers.*
