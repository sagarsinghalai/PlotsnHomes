# Custom domains, per-tenant routing & the subscription sweep

This covers the **operational** (non-code) steps to run white-label tenants on
their own domains, plus how the automatic subscription-expiry sweep is scheduled.

The code side is already built:
- **Per-domain resolution** (`src/lib/public-tenant.ts`): a public request is
  mapped to a tenant by its host — exact custom domain → subdomain label → the
  primary tenant.
- **Subscription → access** (`src/lib/subscription-access.ts`): a tenant whose
  subscription has lapsed is blocked at login/API immediately, data preserved.
- **The sweep** (`/api/cron/subscription-sweep`): flips lapsed tenants to
  `PAST_DUE` so the console/reports stay accurate.

---

## 1. How a visitor is matched to a tenant

`resolvePublicTenantId(host)` resolves in this order:

1. **Exact custom domain** — `acme-realty.com` matches `Organization.domain`.
2. **Subdomain label** — the first label of `acme.yourplatform.com` or
   `acme.localhost` matches `Organization.code` (e.g. code `acme`).
3. **Fallback** — the platform's **primary tenant**.

A `DELETED` organization never resolves. Host matching ignores port and case.

Set a tenant's domain when you create it (platform console → Organizations, or
the self-serve `/pricing` signup "custom domain" field). The domain must be
unique across tenants.

---

## 2. DNS: point the agency's domain at the app

The agency owns `acme-realty.com` and sets DNS at their registrar:

- **Apex/root domain** (`acme-realty.com`): an `A` record to the app server's
  IPv4 (and `AAAA` for IPv6), **or** an `ALIAS`/`ANAME` to your app host if the
  registrar supports it.
- **`www` subdomain**: a `CNAME` to your app host (or to the apex).

If you host the platform yourself (e.g. Hostinger VPS + Nginx), point the records
at that server's IP. On a managed host (Vercel/Netlify), point them at the host's
documented target and add the domain in that host's dashboard.

### Subdomain model (no registrar changes per tenant)
Give every tenant a subdomain of **your** platform domain:
`acme.yourplatform.com`. Add a **wildcard** DNS record `*.yourplatform.com`
→ your server once, and set each `Organization.code` to the subdomain label.

---

## 3. TLS / HTTPS

Every custom domain needs a certificate. Pick the path that matches your host:

- **Vercel / Netlify / similar**: add the domain in the dashboard — certificates
  are issued and renewed automatically (incl. wildcards for the subdomain model).
- **Self-hosted Nginx + Let's Encrypt (Hostinger VPS)**:
  - Per custom domain: `sudo certbot --nginx -d acme-realty.com -d www.acme-realty.com`
  - Subdomain model (wildcard): a DNS-01 wildcard cert for `*.yourplatform.com`
    (`certbot certonly --manual --preferred-challenges dns -d '*.yourplatform.com'`),
    renewed via your DNS provider's API.
  - Certbot installs a renewal timer; verify with `sudo certbot renew --dry-run`.
- **Cloudflare in front**: proxied DNS gives edge TLS automatically; still keep a
  valid origin certificate.

Add each new custom domain to the web server / host **before** the agency's
traffic arrives, or the first requests fail the TLS handshake.

---

## 4. Local development testing

- **Subdomain**: browse `http://<code>.localhost:3001` — modern browsers resolve
  `*.localhost` to `127.0.0.1`, and the resolver matches the label to the org code.
- **Custom domain**: add a hosts entry (`127.0.0.1  acme-realty.test`) and set an
  org's `domain` to `acme-realty.test`, then browse `http://acme-realty.test:3001`.
- No match → you see the **primary tenant** (today's default behaviour).

---

## 5. Scheduling the subscription-expiry sweep

Access is blocked the instant a subscription lapses (the auth gate reads
`subscriptionEndsAt` live). The **sweep** is the bookkeeping half — it sets
`status = PAST_DUE` on lapsed tenants so the console and reports are accurate.

Protect the endpoint: set **`CRON_SECRET`** in the environment. Then present it as
`Authorization: Bearer <secret>`, an `x-cron-secret` header, or `?key=<secret>`.
(With no `CRON_SECRET` set, the route runs only outside production.)

### On Vercel
`vercel.json` already declares the cron (every 5 minutes):
```json
{ "crons": [ { "path": "/api/cron/subscription-sweep", "schedule": "*/5 * * * *" } ] }
```
Vercel sends the request with the project's `CRON_SECRET` as a Bearer token.

### Self-hosted (Hostinger / any Linux) — system cron
Run every 5 minutes (or `* * * * *` for minute-level grants):
```bash
*/5 * * * * curl -fsS -H "x-cron-secret: $CRON_SECRET" https://yourplatform.com/api/cron/subscription-sweep >/dev/null 2>&1
```

> For minute-level grants you can schedule every minute, but it's optional —
> enforcement does not depend on the sweep; only the stored status does.
