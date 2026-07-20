import csv
import io
import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen

from fastapi import APIRouter
from fastapi import HTTPException

from app.config import ALLOWED_ORIGINS


router = APIRouter()

_sst_history_cache = {"loaded_at": 0.0, "source": "", "rows": {}}
_SST_HISTORY_INDEX = "https://n1mmplus.hamdocs.com/mmfiles/categories/callhistory/"


def _load_sst_history():
    if _sst_history_cache["rows"] and time.time() - _sst_history_cache["loaded_at"] < 21600:
        return _sst_history_cache

    index_request = Request(_SST_HISTORY_INDEX, headers={"User-Agent": "AF0FR-Logbook/1.0"})
    with urlopen(index_request, timeout=15) as response:
        index_html = response.read().decode("utf-8", errors="replace")

    pages = re.findall(r'href=["\']([^"\']*k1usnsst-\d+-txt/?)["\']', index_html, re.IGNORECASE)
    if not pages:
        raise ValueError("No K1USN SST call-history release was found")
    latest_page = max(pages, key=lambda page: int(re.search(r"k1usnsst-(\d+)", page, re.IGNORECASE).group(1)))
    release_page = urljoin(_SST_HISTORY_INDEX, latest_page)
    release_request = Request(release_page, headers={"User-Agent": "AF0FR-Logbook/1.0"})
    with urlopen(release_request, timeout=15) as response:
        release_html = response.read().decode("utf-8", errors="replace")

    downloads = re.findall(r'href=["\']([^"\']+\.txt(?:\?[^"\']*)?)["\']', release_html, re.IGNORECASE)
    if not downloads:
        raise ValueError("The SST call-history download was not found")
    source = urljoin(release_page, downloads[-1])
    data_request = Request(source, headers={"User-Agent": "AF0FR-Logbook/1.0"})
    with urlopen(data_request, timeout=20) as response:
        raw = response.read().decode("utf-8-sig", errors="replace")

    parsed = list(csv.reader(io.StringIO(raw)))
    header_index = next((index for index, row in enumerate(parsed) if any(cell.strip().lower() == "call" for cell in row)), None)
    if header_index is None:
        raise ValueError("The SST call-history format was not recognized")
    headers = [cell.strip().lower() for cell in parsed[header_index]]
    rows = {}
    for values in parsed[header_index + 1:]:
        record = {headers[index]: value.strip() for index, value in enumerate(values) if index < len(headers)}
        call = record.get("call", "").upper()
        if call:
            rows[call] = record

    _sst_history_cache.update({"loaded_at": time.time(), "source": source, "rows": rows})
    return _sst_history_cache


@router.get("/health")
def health():
    return {"ok": True}


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


@router.get("/sst/call-history/{callsign}")
def get_sst_call_history(callsign: str):
    normalized = re.sub(r"[^A-Z0-9/]", "", callsign.upper())
    if len(normalized) < 3:
        raise HTTPException(status_code=400, detail="Enter a valid callsign")
    try:
        history = _load_sst_history()
        record = history["rows"].get(normalized)
        if not record:
            return {"callsign": normalized, "found": False, "source": history["source"]}
        return {
            "callsign": normalized,
            "found": True,
            "name": record.get("name", ""),
            "spc": record.get("state", "") or record.get("sect", "") or record.get("section", "") or record.get("qth", ""),
            "notes": record.get("comments", "") or record.get("comment", "") or record.get("notes", ""),
            "source": history["source"],
        }
    except (HTTPError, URLError, TimeoutError, ValueError, csv.Error) as exc:
        print(exc)
        raise HTTPException(status_code=502, detail="Failed to load K1USN SST call history") from exc
