# Gateway CW interest notifications

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
