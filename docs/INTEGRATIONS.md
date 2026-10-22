# Integrations Guide

This document covers the external integrations built into PlotsnHomes:

1. **Lead Channels** — pipe leads from Facebook/Meta, Google Ads, Justdial, MagicBricks, 99acres and any other source straight into the CRM, auto-assigned.
2. **Analytics Integration** — per-project tracking IDs (GA4, GTM, Meta Pixel, etc.) and live Google Analytics numbers.

> Related guides in this folder: `MESSAGING-SETUP.md` (WhatsApp/Telegram/Twilio/Email), `STRIPE-SETUP.md`.

---

## 1. Lead Channels

**Admin → Settings → Integrations → Lead Channels** (`/admin/integrations/lead-channels`)

Incoming leads from each channel hit a public webhook, are validated, mapped to CRM fields, de-duplicated, scored, **auto-assigned to an owner**, and dropped into **All Leads** (filterable by `source`). Every attempt is recorded in an audit log.

### How it works (pipeline)

```
Platform  ──POST──▶  /api/integrations/leads/<channel>
                         │  validate secret / signature
                         │  map fields (name, phone, email, message)
                         ▼
                   createInboundLead()
                         │  de-dupe (same phone + channel within 10 min)
                         │  assign owner (channel rule → team round-robin → global auto-assign)
                         │  score + create Lead (source = channel label)
                         │  LeadActivity "New lead received from <channel>"
                         │  notify agent (WhatsApp) + write InboundLeadLog
                         ▼
                   Shows in Admin → All Leads
```

### Webhook endpoints

| Channel | Webhook URL (append your domain) | Method |
|---|---|---|
| Facebook / Meta | `/api/integrations/leads/meta` | GET (verify) + POST |
| Google Ads | `/api/integrations/leads/google` | POST |
| Justdial | `/api/integrations/leads/justdial?key=<secret>` | POST |
| MagicBricks | `/api/integrations/leads/magicbricks?key=<secret>` | POST |
| 99acres | `/api/integrations/leads/acres99?key=<secret>` | POST |
| Generic (any source) | `/api/integrations/leads/generic?key=<secret>` | POST |

> ⚠️ Webhooks need a **public HTTPS domain** (e.g. `https://app.plotsnhomes.com/...`). `localhost` cannot receive platform callbacks. The exact URL to paste is shown on each channel's card (with the secret pre-filled).

### Per-channel configuration (on the Lead Channels page)

For every channel you can set:

- **Enabled** — turn the channel on/off (a disabled channel ignores incoming calls).
- **Webhook URL** — copy and paste into the platform.
- **Credentials / secret** — see per-platform setup below (a **generate** button creates a strong random value).
- **Field mapping** (portals/generic) — which incoming key maps to each CRM field. Use `|` for alternatives, e.g. `phone|mobile|contact`. Dotted paths like `lead.phone` are supported.
- **Assignment** — pick a **specific owner**, OR a **team** to round-robin within. If neither is set, the global CRM auto-assign rules apply (round-robin among active agents / default owner — see Settings → CRM routing).
- **Default stage** — NEW / CONTACTED / QUALIFIED / SITE_VISIT / NEGOTIATION.
- **Send test lead** — fires a sample lead through the real pipeline so you can confirm it lands before going live.
- **Recent inbound leads** — a live log (CREATED / DUPLICATE / IGNORED / ERROR).

### Platform setup

#### Facebook / Meta Lead Ads
1. Create a Meta App (developers.facebook.com) with the **Webhooks** and **Leads Access** products.
2. On the Lead Channels page (Meta card): click **generate** for the **Verify Token** and **App Secret**, and paste a **Page Access Token** (from a System User / Page with `leads_retrieval`). Save.
3. In the Meta App → Webhooks → **Page** object: set the callback URL to `<domain>/api/integrations/leads/meta`, the **Verify Token** to the value you generated, and subscribe to the **`leadgen`** field.
4. Subscribe your Facebook Page to the app. New Lead Ads submissions now arrive in real time (the app fetches the full lead from the Graph API using the Page token; POSTs are HMAC-verified with the App Secret).

#### Google Ads Lead Form extensions
1. On the Lead Channels page (Google card): click **generate** for the **Webhook Key (google_key)**. Save.
2. In Google Ads → your Lead Form asset → **Webhook integration**: set **Webhook URL** = `<domain>/api/integrations/leads/google` and **Key** = the generated value.
3. Click **Send test data** in Google Ads — a lead should appear in All Leads (the endpoint validates `google_key` and reads `user_column_data`).

#### Justdial / MagicBricks / 99acres (and any other portal)
1. On that channel's card: enable it, click **generate** for the **Webhook Secret**, and (if needed) adjust the **field mapping** to match the portal's payload. Save.
2. Give the portal/partner the webhook URL shown on the card (it already includes `?key=<secret>`). They push each lead as JSON or form-encoded POST.
3. If a field isn't captured, open the **Recent inbound leads** log, check the stored payload, and fix the mapping (e.g. set `phone` to the portal's actual key).

#### Generic webhook (Zapier, custom forms, other channels)
Point any source at `<domain>/api/integrations/leads/generic?key=<secret>` with a JSON body like:

```json
{ "name": "Rahul Sharma", "phone": "+919812345678", "email": "rahul@example.com", "message": "3 BHK in Gurugram" }
```

Adjust the field mapping if your keys differ. Works immediately once enabled.

### Security & reliability
- Portals/generic require the **secret** (as `?key=` or `x-webhook-secret` header) when one is set.
- Meta POSTs are verified via **`X-Hub-Signature-256`** HMAC using the App Secret.
- Google validates the **`google_key`** in the payload.
- **De-duplication:** the same phone on the same channel within 10 minutes is logged as `DUPLICATE` and not re-created (protects against platform retries).
- Endpoints return fast `200`s so platforms don't retry; failures still record an `ERROR` log row.

### Code / data reference
- Settings lib: `src/lib/lead-channels.ts` (config under SystemSetting key `lead_channels`)
- Ingestion helper: `src/lib/inbound-lead.ts` (`createInboundLead`)
- Reused pipeline: `src/lib/lead-routing.ts` (`assignLeadOwner`), `src/lib/lead-scoring.ts`, `src/lib/whatsapp-central.ts`
- Webhooks: `src/app/api/integrations/leads/{meta,google,[channel]}/route.ts`
- Admin APIs: `src/app/api/admin/lead-channels/{route,logs/route,test/route}.ts`
- Admin UI: `src/app/admin/integrations/lead-channels/page.tsx`, `src/components/admin/lead-channels-client.tsx`
- Audit log model: `InboundLeadLog` (Prisma)

---

## 2. Analytics Integration

**Admin → Settings → Analytics Integration** (`/admin/settings/analytics-integration`) — platform-level Google Analytics connection.
**Per project:** Edit Project → **22. Analytics** — tracking IDs for that project.

### Per-project tracking IDs (Edit Project → Analytics)
Paste any of these; the public project page injects the matching scripts automatically:
GA4 Measurement ID, **GA4 Property ID** (for live numbers), Google Tag Manager, Meta Pixel, Search Console verification, Hotjar, Microsoft Clarity, LinkedIn Insight.

### Live Google Analytics numbers
1. Create a Google Cloud **service account**, grant it **Viewer** on your GA4 property, and download the JSON key.
2. Install the client once: `npm i @google-analytics/data`.
3. On **Settings → Analytics Integration**: paste the service-account JSON, tick **Enable live Google Analytics pulls**, Save.
4. Set each project's **GA4 Property ID** (Edit Project → Analytics). Projects with a property ID then show live views; others fall back to the manually-entered numbers.

Until the key is added the live path stays dormant and manual numbers are used — no errors.

### Code reference
- Util: `src/lib/project-analytics.ts` (`getLiveProjectMetrics`)
- Settings: key `analytics_integration` in `src/lib/site-settings.ts`
- Admin API/UI: `src/app/api/admin/analytics-integration/route.ts`, `src/app/admin/settings/analytics-integration/page.tsx`
- Script injection: `src/app/projects/[slug]/page.tsx`

---

## Deploy checklist
- Run `prisma db push` (or a migration) on production so the `InboundLeadLog` table and the new project columns exist.
- Serve the app over **HTTPS on a public domain** so webhooks are reachable.
- Add each platform's credentials on the relevant admin page (they stay dormant until then).
- For live GA: `npm i @google-analytics/data` + add the service-account key.
