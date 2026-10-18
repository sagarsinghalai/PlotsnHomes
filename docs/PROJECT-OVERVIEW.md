# PlotsnHomes — Project Overview

> Full-stack real estate investment & brokerage CRM platform.
> Last updated: 16 October 2026

PlotsnHomes is a production-grade **Next.js 14** web application for fractional
real estate investment and property brokerage. It combines a public marketing/
listings website, an investor & seller dashboard, and a large multi-role **admin
CRM** — with real authentication, payments (Stripe + Razorpay), email, WhatsApp
messaging, KYC, loans, commissions, and an enterprise organization hierarchy.

- **Scale:** ~510 source files · **106 API routes** · **102 pages** · **33 database models**
- **Repository:** `sagarsinghalai/PlotsnHomes` (branch `main`)

---

## 1. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 14** (App Router, Server + Client Components) |
| Language | **TypeScript 5** |
| UI | **React 18**, **Tailwind CSS 3**, **Framer Motion**, **lucide-react** icons |
| ORM / DB | **Prisma 6** — **SQLite** (dev) / **MySQL** (production) |
| Auth | **NextAuth 4** (credentials provider, JWT sessions) + **bcryptjs** |
| Payments | **Razorpay** (primary / INR) and **Stripe** (international / USD) |
| Email | **Resend** (with **Nodemailer** fallback; logs to Admin → Emails if unconfigured) |
| Messaging | **WhatsApp** — official Cloud API + unofficial `whatsapp-web.js` (QR-linked) |
| Media | **Cloudinary** (images/video/PDF); local `public/uploads` fallback |
| Validation | **Zod** |
| Data/Utils | **country-state-city**, **xlsx** (Excel import/export), **qrcode** / **html5-qrcode** |
| Tooling | ESLint, PostCSS, **tsx** (TS script runner), Prisma CLI |

### Key dependencies (from `package.json`)
`next@14.2.35`, `react@18`, `@prisma/client@6`, `next-auth@4`, `stripe@22`,
`razorpay@2`, `resend@6`, `nodemailer@7`, `cloudinary@2`, `whatsapp-web.js@1`,
`zod@4`, `framer-motion@12`, `tailwindcss@3`, `xlsx@0.18`, `qrcode@1`.

---

## 2. User Roles

Authentication supports **13 roles** (Prisma `Role` enum), spanning customers,
internal staff, and an enterprise franchise hierarchy:

| Category | Roles |
|----------|-------|
| **Platform admins** | `SUPERADMIN`, `PLATFORM_ADMIN` |
| **Enterprise hierarchy** | `WHITE_LABEL_ADMIN`, `FRANCHISE_ADMIN`, `BRANCH_MANAGER`, `DEPARTMENT_HEAD`, `TEAM_LEADER`, `EXECUTIVE` |
| **Staff / sales** | `EMPLOYEE`, `AGENT` |
| **Customers** | `BUYER`, `SELLER` |
| **Testing** | `DEMO` |

Access is enforced via `middleware.ts`, `src/lib/roles.ts`,
`src/lib/permissions.ts`, and CRM scoping in `src/lib/crm-access.ts`
(role-based + record-level lead ownership).

### Demo logins (local dev only — password `demo1234`)

| Email | Role |
|-------|------|
| `admin@plotsnhomes.com` | Administrator |
| `agent1@plotsnhomes.com` | Agent |
| `investor@plotsnhomes.com` | Investor |
| `buyer@plotsnhomes.com` | Buyer |

> ⚠️ Demo credentials are for local testing only — never use in production. Run `npm run db:seed` to (re)create them.

---

## 3. Features

### 3.1 Public website (marketing & listings)
- **Home page** — hero, live price ticker, property search, featured listings, "How it works", payments, trading guide, team, and a **lead-capture form** (Name + Phone → CRM).
- **Property listings & detail pages** (`/properties`) — rich media, pricing, yield/cap-rate metrics, print brochure, **lead-capture form** + contact-agent inquiry form.
- **Markets** (`/markets`) — live market overview.
- **Calculators** (`/calculators`) — mortgage, cap rate, gross yield, cash-on-cash, and an **area-value calculator**.
- **Partner onboarding** — Become a Seller (`/become-seller`), Become a White-Label Partner (`/become-white-label`).
- **Custom CMS pages** (`/p/[slug]`) built via the admin Webpage Editor.
- Auth flows — register, login, forgot/reset password.

### 3.2 User dashboard (`/dashboard`)
Investor / seller / agent self-service:
- **List a property** (media upload, admin review)
- **CRM** access (for agents)
- **KYC** submission
- **Loans** — apply & track
- **Transactions** & **Commission** tracking
- **Messages** and **Profile**

### 3.3 Admin console (`/admin`)
A large back-office organized into groups:

| Group | Sections |
|-------|----------|
| **Dashboard** | Overview (AUM, users, listings, revenue analytics), Activity & Audit Logs |
| **People** | Users & accounts, Team hierarchy, Organizations & Franchises, Developers, KYC verification |
| **Listings** | Projects, Properties, Price History, Categories, Property types, Listing types, Statuses, Inventory |
| **Sales & CRM** | All Leads, Pipeline (kanban/forecast), Inquiries, Site visits/Showings, Reports (funnel & analytics), Form Registrations |
| **Finance** | Pricing & Shares, Billing & Subscriptions, Transactions, Wallets, Trade History, Payouts, Payment Methods, Loans, Invoices/Bookings, Rates |
| **Communications** | Hub, WhatsApp Hub, Variables & Templates, Send message, Meetings, Email log, Email Hub (broadcast/audiences) |
| **Settings** | Frontend Settings, Platform, Integrations, Roles & permissions, Dropdown options, Webpage Editor, Footer, White-Label & Subscription Hub, System status, Live markets |

---

## 4. Core Functions / Capabilities

- **Authentication & RBAC** — NextAuth credentials, JWT sessions, 13-role permission model, record-level CRM scoping.
- **Property management** — listings with media (Cloudinary), categories, custom fields, price history logging, featured/status workflows.
- **CRM** — lead capture (public + manual), lead scoring (`lead-scoring.ts`), auto-routing/assignment (`lead-routing.ts`), configurable pipelines & stages, smart lists, activities & tasks, funnel reports.
- **Payments** — Razorpay & Stripe checkout + webhooks; deposits, investments, listing fees, rent, subscriptions, commission payouts.
- **Subscriptions & billing** — plans, user subscriptions, brokerage invoices.
- **Commissions & payouts** — agent commission tracking, rating slabs, payout processing, wallets.
- **KYC** — profile submission, document upload, admin approval.
- **Loans** — applications, bank rates, admin review workflow.
- **Messaging** — WhatsApp (Cloud API + web session), email (Resend), templates & variables, broadcast audiences.
- **Meetings / site visits** — invites, scheduling, showings.
- **Analytics & reporting** — dashboards for sales, leads, properties, agents, customers; CSV/Excel export.
- **Enterprise hierarchy** — Organization → Franchise → Branch → Department → Team, with white-label support.
- **Site customization** — webpage editor, footer, dropdowns, variables/templates, system settings.
- **Currency** — multi-currency display with live exchange rates (XE).

---

## 5. Database

### 5.1 Database files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Canonical schema — **SQLite** (source of truth, local dev) |
| `prisma/schema.mysql.prisma` | **MySQL** schema — auto-generated for production by `scripts/generate-mysql-schema.mjs` (adds `@db.Text` to long fields) |
| `prisma/dev.db` | Local SQLite database (seeded dev data) |
| `prisma/migrations/` | SQLite migration history |
| `prisma/seed.ts` | Demo/seed data (users, properties, leads, etc.) |
| `prisma.config.ts` | Prisma configuration |

- **Dev:** SQLite via `DATABASE_URL="file:./dev.db"`
- **Production:** MySQL — created by `npm run build:hostinger` (`generate-mysql-schema` → `prisma generate` → `prisma db push` → `next build`)

### 5.2 Models (33)

**Users & access:** `User`
**Properties & catalog:** `Property`, `PropertyCategory`, `PropertyPriceLog`, `PropertyShowing`, `Favorite`
**CRM:** `Lead`, `LeadActivity`, `LeadTask`, `CrmGoal`, `Inquiry`, `CustomFieldDef`
**Developers & projects:** `Developer`, `Project`, `DeveloperTask`
**Finance:** `Transaction`, `BrokerageInvoice`, `SubscriptionPlan`, `UserSubscription`, `AgentCommission`, `RatingSlab`
**KYC & loans:** `KycProfile`, `LoanApplication`
**Communications:** `EmailLog`, `MessageLog`, `MeetingInvite`
**Enterprise hierarchy:** `Organization`, `Franchise`, `Branch`, `Department`, `Team`
**System:** `SystemSetting`, `BulkJob`

### 5.3 Enums
`Role`, `PropertyStatus`, `PropertyType`, `ListingType`, `KycStatus`, `LoanStatus`,
`ShowingStatus`, `LeadStage`, `TransactionType`, `TransactionStatus`,
`SubscriptionInterval`, `SubscriptionStatus`, `MessageChannel`, `MessageStatus`,
`MeetingStatus`.

---

## 6. API Surface (106 routes)

| Group | Routes | Group | Routes |
|-------|:------:|-------|:------:|
| `admin/*` | 71 | `webhooks/*` | 5 |
| `auth/*` | 4 | `checkout/*` | 4 |
| `telephony/*` | 4 | `partners/*` | 2 |
| `properties/*` | 2 | `user/*` | 2 |
| `leads`, `inquiries`, `kyc`, `loans`, `meetings`, `messages`, `showings`, `upload`, `whatsapp`, `currency`, `public`, `settings` | 1 each | | |

Public lead capture: `POST /api/leads` (no auth) → creates a CRM `Lead` synced to **Admin → All Leads**.

---

## 7. Project Structure

```
RealEstate_NewDb/
├── prisma/            # schema.prisma, schema.mysql.prisma, dev.db, migrations, seed.ts
├── public/            # static assets, uploads/
├── scripts/           # seeding, admin checks, Hostinger zip, Stripe setup, MySQL schema gen
├── docs/              # DEPLOY-HOSTINGER, STRIPE-SETUP, MESSAGING-SETUP, this file, etc.
└── src/
    ├── app/           # pages + API routes (admin, dashboard, public, api)
    ├── components/    # admin, public, property, ui, calculators, dashboard, layout
    ├── lib/           # auth, prisma, payments, crm, commission, messaging, settings, utils
    ├── hooks/         # shared React hooks
    ├── types/         # TypeScript types
    └── middleware.ts  # route/role protection
```

---

## 8. Deployment

- **Target:** Hostinger (Node.js app) / cPanel with Node.js, or a VPS.
- **Build:** `npm run build:hostinger` (generates MySQL schema, pushes DB, builds).
- **Env:** configure from `.env.production.example` (MySQL `DATABASE_URL`, `NEXTAUTH_*`, Razorpay/Stripe, Resend, Cloudinary, WhatsApp).
- **Full guide:** [DEPLOY-HOSTINGER.md](./DEPLOY-HOSTINGER.md).
- **Launch checklist:** seed an admin user after first deploy (DB starts empty), set Cloudinary keys, and keep credential files out of the repo.

---

*Generated as a reference overview of the PlotsnHomes codebase.*
