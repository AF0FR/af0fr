import json
import math
from functools import lru_cache
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter
from fastapi import HTTPException

from app.config import ALLOWED_ORIGINS


router = APIRouter()


@lru_cache(maxsize=1)
def _pota_us_parks():
    request = Request(
        "https://api.pota.app/program/parks/US",
        headers={"User-Agent": "AF0FR-Ops/1.0", "Accept": "application/json"},
    )
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def _distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    value = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


@router.get("/health")
def health():
    return {"ok": True}


@router.get("/pota/parks/nearby")
def nearby_pota_parks(lat: float = 38.47, lon: float = -90.30, limit: int = 12):
    try:
        nearby = []
        for park in _pota_us_parks():
            try:
                park_lat = float(park["latitude"])
                park_lon = float(park["longitude"])
            except (KeyError, TypeError, ValueError):
                continue
            nearby.append({**park, "miles": round(_distance_miles(lat, lon, park_lat, park_lon))})
        return sorted(nearby, key=lambda park: park["miles"])[:max(1, min(limit, 50))]
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(exc)
        raise HTTPException(status_code=502, detail="Failed to load POTA parks") from exc


@router.get("/debug/cors")
def debug_cors():
    return {
        "allowedOrigins": [origin.strip() for origin in ALLOWED_ORIGINS],
    }


@router.get("/dx-summit/spots")
def get_dx_summit_spots(limit: int = 50):
    bounded_limit = max(1, min(limit, 200))
    query = urlencode(
        {
            "limit": bounded_limit,
            "limit_time": "true",
        }
    )
    request = Request(
        f"http://www.dxsummit.fi/api/v1/spots?{query}",
        headers={
            "User-Agent": "AF0FR-Logbook/1.0",
            "Accept": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(exc)
        raise HTTPException(
            status_code=502,
            detail="Failed to load DX Summit spots",
        ) from exc
