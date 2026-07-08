# PlotsnHomes — Professional Real Estate Platform

Full-stack **Next.js 14** real estate investment platform with real user accounts, Stripe payments, email notifications, investment calculators, and an admin dashboard (replacing static HTML prototypes).

## Features

| Feature | Technology |
|---------|------------|
| Frontend | Next.js 14, React, Tailwind CSS |
| Database | SQLite + Prisma (swap to PostgreSQL for production) |
| Auth | NextAuth (credentials) — Admin, Agent, Investor, Buyer |
| Payments | Stripe Checkout + webhooks |
| Email | Resend (logs to console if no API key) |
| Calculations | Mortgage, cap rate, gross yield, cash-on-cash |
| Admin panel | `/admin` — users, properties, transactions, inquiries |

## Quick start

```powershell
cd plotsnhomes
copy .env.example .env
npm install
npm run db:seed
npm run dev
```

Open **http://localhost:3000**

### Demo logins (password: `demo1234`)

| Email | Role |
|-------|------|
| admin@plotsnhomes.com | Admin |
| agent@plotsnhomes.com | Agent |
| investor@plotsnhomes.com | Investor |
| buyer@plotsnhomes.com | Buyer |

## Enable real email & payments

Edit `.env`:

1. **NEXTAUTH_SECRET** — random string (`openssl rand -base64 32`)
2. **Stripe** — [test keys](https://dashboard.stripe.com/test/apikeys)
3. **Resend** — [API key](https://resend.com) for transactional email
4. **Stripe webhook** (local): `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Project structure

```
plotsnhomes/
├── prisma/schema.prisma   # Users, properties, transactions
├── prisma/seed.ts         # Demo data
└── src/
    ├── app/               # Pages + API routes
    ├── components/        # UI, property, admin
    └── lib/               # Auth, Stripe, email, calculations
```

## Import your HTML design

If you have `plotsnhomes-admin-final_6.html`, copy it into this repo (e.g. `design/reference.html`) and we can port sections into React components under `src/components/`.

## Deploy on Hostinger

Full guide: **[docs/DEPLOY-HOSTINGER.md](docs/DEPLOY-HOSTINGER.md)**

Quick summary:

1. Need **Business** or **Cloud** plan (Node.js Web Apps).
2. Push to GitHub or run `.\scripts\prepare-hostinger-zip.ps1` and upload zip.
3. hPanel → **Add Website** → **Node.js Apps** → connect repo.
4. Build: `npm run build:hostinger` · Start: `npm run start -- -p $PORT`
5. Add env vars from `.env.production.example` (use **MySQL**, not SQLite).

**Basic PHP-only Hostinger?** Use `real-estate-wp` (WordPress) instead — copy via All-in-One WP Migration.

## Author

Joydeep Gharami
