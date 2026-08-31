import smtplib
from email.message import EmailMessage

from app.config import (
    SMTP_FROM_EMAIL,
    SMTP_HOST,
    SMTP_NOTIFICATION_EMAIL,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_USE_SSL,
    SMTP_USE_STARTTLS,
)


class EmailConfigurationError(RuntimeError):
    pass


def send_gateway_interest_notification(email: str) -> None:
    if not all((SMTP_HOST, SMTP_FROM_EMAIL, SMTP_NOTIFICATION_EMAIL)):
        raise EmailConfigurationError("SMTP notifications are not configured")

    message = EmailMessage()
    message["Subject"] = "New Gateway CW interest signup"
    message["From"] = SMTP_FROM_EMAIL
    message["To"] = SMTP_NOTIFICATION_EMAIL
    message.set_content(f"A new visitor is interested in Gateway CW.\n\nEmail: {email}\n")

    smtp_class = smtplib.SMTP_SSL if SMTP_USE_SSL else smtplib.SMTP
    with smtp_class(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
        if not SMTP_USE_SSL and SMTP_USE_STARTTLS:
            smtp.starttls()
        if SMTP_USERNAME:
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
        smtp.send_message(message)
