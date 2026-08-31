import smtplib
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status

from app.db import get_connection
from app.models.gateway_cw import (
    CallsignModel,
    GatewayBandUpdate,
    GatewayChatCreate,
    GatewayCheckinCreate,
    GatewayInterestCreate,
    GatewaySessionCreate,
)
from app.services.email import EmailConfigurationError, send_gateway_interest_notification


router = APIRouter(prefix="/gateway-cw", tags=["Gateway CW"])


@router.post("/interest", status_code=status.HTTP_201_CREATED)
def register_gateway_interest(payload: GatewayInterestCreate):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "insert into gateway_cw_interest (email) values (%s) on conflict (email) do nothing returning email",
                (payload.email,),
            )
            if not cur.fetchone():
                return {"message": "You're already on the Gateway CW interest list."}

            try:
                send_gateway_interest_notification(payload.email)
            except EmailConfigurationError as exc:
                raise HTTPException(status_code=503, detail=str(exc)) from exc
            except (OSError, smtplib.SMTPException) as exc:
                raise HTTPException(status_code=502, detail="The notification email could not be sent. Please try again.") from exc

    return {"message": "Thanks — your interest has been recorded."}


def _iso(value):
    return value.isoformat() if value else None


def _snapshot(cur, session_id: UUID | None = None):
    if session_id:
        cur.execute("select * from gateway_cw_sessions where id = %s", (session_id,))
    else:
        cur.execute("select * from gateway_cw_sessions where status = 'live' order by started_at desc limit 1")
    session = cur.fetchone()
    if not session:
        return None
    sid = session[0]
    cur.execute(
        "select id, session_id, band, position, status, frequency, question, ncs_callsign, ncs_qth, reported_by, started_at, ended_at, updated_at from gateway_cw_bands where session_id = %s order by position",
        (sid,),
    )
    bands = []
    for row in cur.fetchall():
        band_id = row[0]
        cur.execute(
            "select id, callsign, preferred_speed, checkin_type, relayed_by, entered_by, created_at, qso_status, closed_by, closed_at from gateway_cw_checkins where band_id = %s order by created_at",
            (band_id,),
        )
        checkins = [
            {"id": str(c[0]), "callsign": c[1], "preferredSpeed": c[2], "checkinType": c[3],
             "relayedBy": c[4], "enteredBy": c[5], "createdAt": _iso(c[6]), "qsoStatus": c[7],
             "closedBy": c[8], "closedAt": _iso(c[9])}
            for c in cur.fetchall()
        ]
        cur.execute(
            "select id, callsign, message, created_at from gateway_cw_chat where band_id = %s order by created_at",
            (band_id,),
        )
        chat = [{"id": str(c[0]), "callsign": c[1], "message": c[2], "createdAt": _iso(c[3])} for c in cur.fetchall()]
        bands.append({
            "id": str(row[0]), "band": row[2], "position": row[3], "status": row[4],
            "frequency": row[5], "question": row[6], "ncsCallsign": row[7], "ncsQth": row[8], "reportedBy": row[9],
            "startedAt": _iso(row[10]), "endedAt": _iso(row[11]), "updatedAt": _iso(row[12]),
            "checkins": checkins, "chat": chat,
        })
    return {
        "id": str(session[0]), "status": session[1], "scheduled": session[2], "startedBy": session[3],
        "announcement": session[4], "startedAt": _iso(session[5]), "endedAt": _iso(session[6]),
        "updatedAt": _iso(session[7]), "bands": bands,
    }


@router.get("/live")
def get_live_gateway_net():
    with get_connection() as conn:
        with conn.cursor() as cur:
            return {"session": _snapshot(cur)}


@router.get("/history")
def get_gateway_history(limit: int = 12):
    limit = max(1, min(limit, 50))
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("select id from gateway_cw_sessions where status = 'closed' order by started_at desc limit %s", (limit,))
            return {"sessions": [_snapshot(cur, row[0]) for row in cur.fetchall()]}


@router.post("/sessions", status_code=201)
def create_gateway_session(payload: GatewaySessionCreate):
    session_id = uuid4()
    now = datetime.now(timezone.utc)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "insert into gateway_cw_sessions (id, scheduled, started_by, announcement) values (%s, %s, %s, %s)",
                (session_id, payload.scheduled, payload.callsign, payload.announcement.strip()),
            )
            for position, selected_band in enumerate(payload.bands):
                status = "live_soon" if position == 0 else "upcoming"
                cur.execute(
                    "insert into gateway_cw_bands (id, session_id, band, position, status, frequency, question, ncs_callsign, ncs_qth, reported_by, started_at, ended_at) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (uuid4(), session_id, selected_band.band, position, status, selected_band.frequency,
                     payload.question.strip() if position == 0 else "", payload.callsign, payload.qth.strip(),
                     payload.callsign if position == 0 else "", None,
                     now if status == "closed" else None),
                )
            return _snapshot(cur, session_id)


@router.patch("/bands/{band_id}")
def update_gateway_band(band_id: UUID, payload: GatewayBandUpdate):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("select session_id from gateway_cw_bands where id = %s", (band_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "Band session not found")
            fields = ["reported_by = %s", "updated_at = now()"]
            values = [payload.callsign]
            for column, value in (("frequency", payload.frequency), ("question", payload.question), ("ncs_callsign", payload.ncsCallsign), ("ncs_qth", payload.ncsQth)):
                if value is not None:
                    fields.append(f"{column} = %s")
                    values.append(value.strip().upper() if column == "ncs_callsign" else value.strip())
            values.append(band_id)
            cur.execute(f"update gateway_cw_bands set {', '.join(fields)} where id = %s", tuple(values))
            if payload.announcement is not None:
                cur.execute("update gateway_cw_sessions set announcement = %s, updated_at = now() where id = %s", (payload.announcement.strip(), row[0]))
            else:
                cur.execute("update gateway_cw_sessions set updated_at = now() where id = %s", (row[0],))
            return _snapshot(cur, row[0])


@router.post("/bands/{band_id}/activate")
def activate_gateway_band(band_id: UUID, actor: GatewayBandUpdate):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("select session_id, position from gateway_cw_bands where id = %s", (band_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "Band session not found")
            session_id, position = row
            cur.execute("select id from gateway_cw_bands where session_id = %s and status = 'live' and id <> %s", (session_id, band_id))
            closing_ids = [r[0] for r in cur.fetchall()]
            if closing_ids:
                cur.execute("delete from gateway_cw_chat where band_id = any(%s)", (closing_ids,))
            cur.execute("update gateway_cw_bands set status = 'closed', ended_at = now(), updated_at = now() where session_id = %s and status = 'live'", (session_id,))
            cur.execute(
                "update gateway_cw_bands set status = 'live', started_at = coalesce(started_at, now()), frequency = %s, question = %s, ncs_callsign = %s, ncs_qth = %s, reported_by = %s, updated_at = now() where id = %s",
                ((actor.frequency or '').strip(), (actor.question or '').strip(), (actor.ncsCallsign or actor.callsign).strip().upper(), (actor.ncsQth or '').strip(), actor.callsign, band_id),
            )
            cur.execute("update gateway_cw_sessions set updated_at = now() where id = %s", (session_id,))
            return _snapshot(cur, session_id)


@router.post("/bands/{band_id}/live-soon")
def mark_gateway_band_live_soon(band_id: UUID):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                update gateway_cw_bands
                set status = 'live_soon', updated_at = now()
                where id = %s and status = 'upcoming'
                returning session_id
                """,
                (band_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(409, "Only an upcoming band can be marked live soon")
            cur.execute("update gateway_cw_sessions set updated_at = now() where id = %s", (row[0],))
            return _snapshot(cur, row[0])


@router.post("/bands/{band_id}/checkins", status_code=201)
def add_gateway_checkin(band_id: UUID, payload: GatewayCheckinCreate):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("select session_id from gateway_cw_bands where id = %s", (band_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "Band session not found")
            qso_status = "pending" if payload.checkinType == "online" else "open"
            cur.execute(
                """
                insert into gateway_cw_checkins
                    (id, session_id, band_id, callsign, preferred_speed, checkin_type,
                     relayed_by, entered_by, qso_status, closed_by, closed_at)
                values (%s,%s,%s,%s,%s,%s,%s,%s,%s,'',null)
                on conflict (band_id, callsign) do update set
                    preferred_speed = coalesce(excluded.preferred_speed, gateway_cw_checkins.preferred_speed),
                    checkin_type = excluded.checkin_type,
                    relayed_by = excluded.relayed_by,
                    entered_by = excluded.entered_by,
                    qso_status = excluded.qso_status,
                    closed_by = '',
                    closed_at = null
                """,
                (uuid4(), row[0], band_id, payload.callsign, payload.preferredSpeed,
                 payload.checkinType, payload.relayedBy, payload.enteredBy.strip().upper(), qso_status),
            )
            cur.execute("update gateway_cw_sessions set updated_at = now() where id = %s", (row[0],))
            return _snapshot(cur, row[0])


@router.post("/checkins/{checkin_id}/close")
def close_gateway_qso(checkin_id: UUID, actor: CallsignModel):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                update gateway_cw_checkins
                set qso_status = 'closed', closed_by = %s, closed_at = now()
                where id = %s
                returning session_id
                """,
                (actor.callsign, checkin_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "Check-in not found")
            cur.execute("update gateway_cw_sessions set updated_at = now() where id = %s", (row[0],))
            return _snapshot(cur, row[0])


@router.post("/bands/{band_id}/chat", status_code=201)
def add_gateway_chat(band_id: UUID, payload: GatewayChatCreate):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("select session_id, status from gateway_cw_bands where id = %s", (band_id,))
            row = cur.fetchone()
            if not row or row[1] != "live":
                raise HTTPException(409, "Chat is available only while this band is live")
            cur.execute("select created_at from gateway_cw_chat where callsign = %s order by created_at desc limit 1", (payload.callsign,))
            recent = cur.fetchone()
            if recent and (datetime.now(timezone.utc) - recent[0]).total_seconds() < 3:
                raise HTTPException(429, "Please wait a moment before posting again")
            cur.execute("insert into gateway_cw_chat (id, session_id, band_id, callsign, message) values (%s,%s,%s,%s,%s)", (uuid4(), row[0], band_id, payload.callsign, payload.message.strip()))
            cur.execute("update gateway_cw_sessions set updated_at = now() where id = %s", (row[0],))
            return _snapshot(cur, row[0])


@router.post("/sessions/{session_id}/close")
def close_gateway_session(session_id: UUID, actor: CallsignModel):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("delete from gateway_cw_chat where session_id = %s", (session_id,))
            cur.execute("update gateway_cw_bands set status = 'closed', ended_at = coalesce(ended_at, now()), updated_at = now() where session_id = %s", (session_id,))
            cur.execute("update gateway_cw_sessions set status = 'closed', ended_at = now(), updated_at = now() where id = %s", (session_id,))
            if cur.rowcount == 0:
                raise HTTPException(404, "Net not found")
            return _snapshot(cur, session_id)
