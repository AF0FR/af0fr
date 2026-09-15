# Gateway CW interest notifications

## Net-control roster

Backend startup imports the 85 contacts in `app/data/club_roster.json` once.
Only callsign, name, city, and club status are included; distance is calculated
by the net-control page. Phone numbers, email addresses, and officer titles
are omitted. Existing contacts are matched by callsign (or name for a contact
without a callsign), retaining their IDs and notes. The import is recorded in
`net_control_roster_imports` in the same transaction, so later roster edits and
removals survive restarts. Deploy/restart the backend to apply the import.

## Email configuration

The `POST /gateway-cw/interest` endpoint stores unique email addresses and sends an SMTP notification for each new signup. Configure these environment variables on the backend host:

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=gatewaycw@example.com
SMTP_NOTIFICATION_EMAIL=you@example.com
SMTP_USE_SSL=false
SMTP_USE_STARTTLS=true
```

Use `SMTP_USE_SSL=true`, `SMTP_USE_STARTTLS=false`, and usually port `465` for implicit TLS. Keep all SMTP values in `backend/.env` locally or in the hosting provider's secret environment settings; never expose them in the Angular environment files.
