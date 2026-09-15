import json
from pathlib import Path

from app.db import get_connection


def import_club_roster():
    """Import once so subsequent roster edits and removals remain effective."""
    members = json.loads(
        (Path(__file__).parent / "data" / "club_roster.json").read_text()
    )
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                create table if not exists net_control_roster_imports (
                    id text primary key,
                    imported_at timestamptz not null default now()
                )
            """)
            cur.execute("""
                insert into net_control_roster_imports (id)
                values ('club-roster-2026-09-14')
                on conflict do nothing
                returning id
            """)
            if cur.fetchone() is None:
                return

            for member in members:
                # Keep existing IDs and notes, including references from check-ins.
                cur.execute("""
                    select id from net_control_roster_members
                    where (callsign <> '' and callsign = %s)
                       or (callsign = '' and %s = '' and lower(name) = lower(%s))
                """, (member["callsign"], member["callsign"], member["name"]))
                existing = cur.fetchone()
                if existing:
                    cur.execute("""
                        update net_control_roster_members
                        set name = %s, city = coalesce(%s, city),
                            status = %s, updated_at = now()
                        where id = %s
                    """, (member["name"], member["city"], member["status"], existing[0]))
                else:
                    member_id = "seed-" + (
                        member["callsign"] or member["name"].replace(" ", "-")
                    ).lower()
                    cur.execute("""
                        insert into net_control_roster_members
                            (id, callsign, name, city, status, source)
                        values (%s, %s, %s, %s, %s, 'seed')
                    """, (member_id, member["callsign"], member["name"],
                          member["city"], member["status"]))
