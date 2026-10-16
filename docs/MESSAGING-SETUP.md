# Admin messaging & meetings

## Admin pages

| Page | URL |
|------|-----|
| Send message | `/admin/messages` |
| Meetings | `/admin/meetings` |
| Integrations | `/admin/integrations` |

## Channels

- **WhatsApp Web** — opens `wa.me` with the user's profile phone (no API key)
- **WhatsApp API** — Meta Cloud API (token + phone number ID in Integrations)
- **Email** — Resend, or Gmail SMTP if configured
- **Telegram** — bot token + user's phone/chat ID on profile
- **SMS** — Twilio (SID, token, from number)

Phone numbers are **always read from the user profile** — edit in Admin → Users.

## Meetings

1. Admin → Send message → **Schedule Meeting & Send**
2. Client gets email + WhatsApp with link: `/meetings/{token}`
3. Client books via Calendly embed or confirms a time
4. Admin + agent notified by **email** and **WhatsApp** (using their profile phones)

## Gmail / company inbox

Admin → Integrations:

- **Notification inbox** — receives meeting alerts
- **Gmail SMTP** — use App Password for sending from company email

## Setup checklist

1. Admin → Integrations → set WhatsApp mode (web or API)
2. Add Calendly URL and/or custom Zoom/Meet URL
3. Add user phone numbers in Admin → Users
4. Optional: Twilio for SMS, Telegram bot token, Gmail SMTP
