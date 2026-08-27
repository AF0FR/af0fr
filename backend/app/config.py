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
