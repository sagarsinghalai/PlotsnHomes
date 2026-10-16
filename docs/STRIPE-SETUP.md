# Stripe real payments — setup (5 minutes)

PlotsnHomes uses **Stripe Checkout** for real card payments (test mode for development).

## Step 1 — Create Stripe account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Complete signup (free)

## Step 2 — Get TEST API keys

1. Open [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy:
   - **Publishable key** → starts with `pk_test_`
   - **Secret key** → click Reveal → starts with `sk_test_`

## Step 3 — Add to `.env`

Edit `plotsnhomes/.env`:

```env
STRIPE_SECRET_KEY=sk_test_paste_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_paste_your_publishable_key_here

# Optional for webhooks (production / stripe CLI)
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001
```

## Step 4 — Restart the app

```powershell
cd plotsnhomes
npm run dev
```

Open **http://localhost:3001**

## Step 5 — Enable payment methods in Stripe (recommended)

In [Stripe Dashboard → Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods), turn on:

- Cards
- Link
- US bank debits (ACH)
- Cash App Pay (optional)
- Klarna / Affirm (optional, for “Pay over time”)

PlotsnHomes lets buyers pick the method on each property page.

## Step 6 — Test payment

1. Log in (any user, e.g. `investor@plotsnhomes.com` / `demo1234`)
2. Open any property
3. Choose **payment amount** (deposit, investment tier, rent, etc.)
4. Choose **payment method** (card, bank, wallets, BNPL, or all)
5. Click **Pay securely** → Stripe Checkout opens
6. On Stripe Checkout use test card:

| Field | Value |
|-------|--------|
| Card number | `4242 4242 4242 4242` |
| Expiry | any future date (e.g. `12/34`) |
| CVC | any 3 digits |
| ZIP | any 5 digits |

7. After pay → redirected to **Transactions** with status **COMPLETED**

### Payment options on each listing

| Amount | Description |
|--------|-------------|
| 10% deposit | Standard property hold |
| 25% down | Larger commitment |
| $1k / $5k / $10k | Investment tiers |
| First month rent | Rental listings only |

| Method | Stripe rail |
|--------|-------------|
| All methods | Card, ACH, Link, Cash App, Klarna, Affirm |
| Credit / debit | Card + Link |
| Apple / Google Pay | Wallets (via Stripe Checkout) |
| Bank (ACH) | US bank account |
| Cash App Pay | Cash App |
| Pay over time | Klarna / Affirm |

## How it works in code

1. `POST /api/checkout` → creates PENDING transaction + Stripe Checkout URL
2. User pays on Stripe hosted page
3. Return URL verifies payment → `COMPLETED` + confirmation email
4. Webhook (optional) also marks COMPLETED for production

## Webhook (optional for local)

For production or advanced local testing:

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run:

```powershell
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

3. Copy the `whsec_...` secret into `.env` as `STRIPE_WEBHOOK_SECRET`

**Note:** Webhook is optional locally — success URL verification completes the payment automatically.

## Admin

- **Admin → Transactions** — all Stripe payments
- **Admin → System status** — shows if Stripe keys are configured

## Go live (production)

1. Switch dashboard to **Live mode**
2. Use `sk_live_` and `pk_live_` keys in Hostinger `.env`
3. Set up live webhook: `https://yourdomain.com/api/webhooks/stripe`
4. Event: `checkout.session.completed`
