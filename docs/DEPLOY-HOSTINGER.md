# Deploying PlotsnHomes to Hostinger

A complete, step-by-step guide to taking this app live on Hostinger.

PlotsnHomes is a **Next.js 14 (Node.js) application** — not static HTML or PHP. It
needs a plan that can run Node.js. Local development uses **SQLite**; production
uses **MySQL**. The MySQL schema is generated automatically at build time, so you
never edit the Prisma schema by hand for production.

---

## 0. What you need before you start

| Requirement | Notes |
|-------------|-------|
| **Hostinger plan with Node.js** | **Business** or **Cloud** hosting, or a **VPS**. Basic PHP-only shared hosting will **not** run this app. |
| **Node.js 20** | Set in the app config (Step 4). |
| **A MySQL database** | Created in hPanel (Step 2). |
| **Your code** | On **GitHub** (recommended) or a **.zip** of this folder. |
| **A domain** | Pointed at Hostinger, or use Hostinger's temporary domain first. |
| **Payment / email keys** | Razorpay (primary), optionally Stripe, Resend — live keys for production. |

> **Which method?**
> - **Method A — Git** (recommended): connect a GitHub repo, Hostinger builds on deploy.
> - **Method B — ZIP upload**: no GitHub needed.
> - **Method C — VPS**: full control via SSH + PM2 + Nginx.

---

## 1. How the SQLite → MySQL switch works (read this once)

You do **not** manually change the database provider. Here is the design:

- `prisma/schema.prisma` → **SQLite** (used for local development).
- `scripts/generate-mysql-schema.mjs` → generates `prisma/schema.mysql.prisma`
  (**MySQL** + `@db.Text` on long text/JSON columns) automatically.
- `npm run build:hostinger` runs that generator, then builds against the MySQL
  schema:

  ```
  node scripts/generate-mysql-schema.mjs
  prisma generate --schema prisma/schema.mysql.prisma
  prisma db push   --schema prisma/schema.mysql.prisma   # creates the tables
  next build
  ```

So on Hostinger you just set the build command to `npm run build:hostinger` and
point `DATABASE_URL` at MySQL — the tables are created on first deploy.

---

## 2. Create the MySQL database (hPanel)

1. hPanel → **Databases** → **MySQL Databases**.
2. Create a **database**, a **user**, and a **password**. Save all three.
3. Grant the user **all privileges** on that database.
4. Note the **host** (usually `localhost` on shared hosting).

Your connection string (`DATABASE_URL`) will look like:

```
mysql://DBUSER:DBPASSWORD@localhost:3306/DBNAME
```

Example: `mysql://u123456_brick:S3cr3t@localhost:3306/u123456_plotsnhomes`

> **Password special characters must be URL-encoded** in the string:
> `@` → `%40`, `#` → `%23`, `:` → `%3A`, `/` → `%2F`, `?` → `%3F`.

---

## 3. Get your code to Hostinger

### Option A — GitHub (recommended)

```powershell
cd "C:\Users\Sagar\Realestate CRM\Real-estate-main"
git init
git add .
git commit -m "PlotsnHomes initial deploy"
# Create an empty repo on GitHub, then:
git remote add origin https://github.com/YOUR_USER/plotsnhomes.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `.next`, `.env`, `dev.db`, and the
generated `prisma/schema.mysql.prisma`. The real `.env` is **not** committed —
you set those values in hPanel (Step 5).

### Option B — ZIP upload

Zip this folder **excluding** `node_modules`, `.next`, and `.env`. Include
`src/`, `prisma/`, `public/`, `scripts/`, and all config files
(`package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json`,
`tailwind.config.ts`, `postcss.config.mjs`, `prisma.config.ts`).

---

## 4. Create the Node.js app in hPanel

1. hPanel → **Websites** → **Add Website** → **Node.js Apps**
   (may be shown as *Frontend web app → Node.js*).
2. **Import Git Repository** → connect GitHub → select your repo
   (for ZIP: choose upload and provide the zip).
3. **Node.js version:** `20`.
4. **Application root / Root directory:** the folder that contains
   `package.json` (leave as repo root unless your repo nests the project in a
   subfolder — then set it to that subfolder).

---

## 5. Set environment variables (hPanel → your app → Environment)

Use `.env.production.example` in this repo as the checklist. Set at least:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `mysql://DBUSER:DBPASSWORD@localhost:3306/DBNAME` (from Step 2) |
| `NEXTAUTH_URL` | `https://yourdomain.com` (https, **no trailing slash**) |
| `NEXTAUTH_SECRET` | long random string (generator below) |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_NAME` | `PlotsnHomes` |
| `RAZORPAY_KEY_ID` | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **same value** as `RAZORPAY_KEY_ID` |
| `RAZORPAY_WEBHOOK_SECRET` | set after Step 8 |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | optional (international cards) |
| `RESEND_API_KEY` | `re_...` (else emails just log to Admin → Emails) |
| `EMAIL_FROM` | `PlotsnHomes <noreply@yourdomain.com>` |
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_API_VERSION` | optional (WhatsApp hub) |

Generate `NEXTAUTH_SECRET` (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

> ⚠️ **Set env vars BEFORE the first build.** Variables prefixed with
> `NEXT_PUBLIC_` are baked into the frontend at **build time**. If you change one
> later, you must **redeploy/rebuild** for it to take effect.

---

## 6. Build & start commands (hPanel build settings)

| Setting | Value |
|---------|-------|
| **Install command** | `npm ci` |
| **Build command** | `npm run build:hostinger` |
| **Start command** | `npm run start:hostinger` |

- `build:hostinger` generates the MySQL schema, creates the tables
  (`prisma db push`), and builds the app.
- `start:hostinger` runs `next start -p ${PORT:-3000}` — it binds to the
  **`PORT`** that Hostinger provides automatically. Do not hardcode a port.

---

## 7. Deploy, then create the admin / seed data

1. Click **Deploy**. First build takes ~5–15 minutes.
2. When it's live, create your login. If Hostinger gives you **SSH** or an app
   **terminal**, run one of these from the app root:

   **Option A — create just an admin account (recommended for production):**
   ```bash
   npx tsx scripts/ensure-admin.ts
   ```
   This creates `admin@plotsnhomes.com` with the default password `demo1234`.
   > 🔒 **Change this immediately.** Either edit `ADMIN_EMAIL` / `ADMIN_PASSWORD`
   > at the top of `scripts/ensure-admin.ts` before running it, or log in once and
   > change the password from the profile/admin settings. Never leave the default
   > password on a live site.

   **Option B — load full demo data (220 sample properties, demo users):**
   ```bash
   npx tsx prisma/seed.ts
   ```

   > Use `npx tsx prisma/seed.ts` directly — **not** `npm run db:seed`, because
   > that script targets the local SQLite schema. The tables already exist from
   > `build:hostinger`, and the Prisma client is already MySQL after the build.

---

## 8. Payment webhooks (do this after the site is live)

### Razorpay (primary)
1. Razorpay Dashboard → **Settings → Webhooks** → **Add New Webhook**.
2. URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Copy the **webhook secret** → set `RAZORPAY_WEBHOOK_SECRET` in hPanel → **Redeploy**.

### Stripe (optional)
1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**.
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. Event: `checkout.session.completed`.
4. Copy the **signing secret** → set `STRIPE_WEBHOOK_SECRET` in hPanel → **Redeploy**.

---

## 9. Enable SSL (HTTPS)

hPanel → **SSL** → enable the free certificate for your domain. Confirm
`NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` both use `https://`.

---

## 10. Post-deploy checklist

- [ ] Home page loads over `https://`.
- [ ] `/properties` shows listings.
- [ ] You can register a new account and log in.
- [ ] Admin login works (`/admin` loads for the admin user).
- [ ] A test payment reaches the webhook (transaction appears in Admin).
- [ ] Emails send (or log under Admin → Emails if no Resend key).
- [ ] `NEXTAUTH_URL` exactly matches the live URL (no trailing slash).

---

## Method C — VPS (KVM), for full control

```bash
# SSH into the VPS
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

git clone https://github.com/YOUR_USER/plotsnhomes.git
cd plotsnhomes
cp .env.production.example .env    # edit with real values (nano .env)
npm ci
npm run build:hostinger            # generates MySQL schema, pushes tables, builds
npx tsx scripts/ensure-admin.ts    # or: npx tsx prisma/seed.ts for demo data
pm2 start npm --name plotsnhomes -- run start:hostinger
pm2 save && pm2 startup
```

Then reverse-proxy Nginx to `http://127.0.0.1:3000` (or the port you set via
`PORT`) and run `certbot --nginx -d yourdomain.com` for SSL.

Minimal Nginx server block:

```nginx
server {
  server_name yourdomain.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| Build fails: `Missing required environment variable: DATABASE_URL` | `DATABASE_URL` not set in hPanel env. Add it before deploying. |
| Build fails on `prisma db push` | `DATABASE_URL` wrong, DB user lacks privileges, or password not URL-encoded. |
| `Data too long for column` at runtime | A new long/JSON field isn't `@db.Text`. Add it to `TEXT_FIELDS` in `scripts/generate-mysql-schema.mjs`, then redeploy. |
| 500 on login / redirect loop | `NEXTAUTH_URL` must be the exact live `https://` URL with no trailing slash; `NEXTAUTH_SECRET` must be set. |
| Payments don't complete | Add live Razorpay/Stripe keys **and** the webhook secret, then redeploy. |
| No emails arrive | Add `RESEND_API_KEY` and verify your sending domain in Resend. Without it, emails log to Admin → Emails. |
| Frontend shows old URL / wrong config | `NEXT_PUBLIC_*` vars are baked at build time — change them in hPanel and **redeploy**. |
| App won't start / wrong port | Use `npm run start:hostinger` (binds to `$PORT`); don't hardcode 3000. |
| Data lost after redeploy | You're on SQLite. Make sure `DATABASE_URL` points to **MySQL** so data persists. |

---

## Quick reference

| | Local | Production (Hostinger) |
|---|-------|------------------------|
| Database | SQLite (`prisma/schema.prisma`) | MySQL (auto-generated `schema.mysql.prisma`) |
| Env file | `.env` | hPanel env vars (`.env.production.example` = checklist) |
| Install | `npm install` | `npm ci` |
| Build | `npm run build` | `npm run build:hostinger` |
| Start | `npm run start:local` (port 3005) | `npm run start:hostinger` (binds `$PORT`) |
| Seed | `npm run db:seed` | `npx tsx prisma/seed.ts` (or `scripts/ensure-admin.ts`) |
