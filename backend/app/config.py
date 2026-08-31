import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).parents[1] / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]
_REQUIRED_ORIGINS = (
    "https://af0fr.com",
    "https://www.af0fr.com",
    "http://localhost:4200",
    "http://localhost:4201",
    "http://127.0.0.1:4200",
    "http://127.0.0.1:4201",
)
_CONFIGURED_ORIGINS = tuple(
    origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin.strip()
)
ALLOWED_ORIGINS = list(dict.fromkeys((*_REQUIRED_ORIGINS, *_CONFIGURED_ORIGINS)))

# Accept the production Vercel alias and this project's generated preview URLs.
# Override this in Render if the Vercel project uses a different project slug.
ALLOWED_ORIGIN_REGEX = os.getenv(
    "ALLOWED_ORIGIN_REGEX",
    r"https://af0fr(?:-[a-z0-9-]+)?\.vercel\.app",
)

SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME).strip()
SMTP_NOTIFICATION_EMAIL = os.getenv("SMTP_NOTIFICATION_EMAIL", "").strip()
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() in {"1", "true", "yes"}
SMTP_USE_STARTTLS = os.getenv("SMTP_USE_STARTTLS", "true").lower() in {"1", "true", "yes"}
