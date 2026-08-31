from app.db import get_connection


def ensure_cw_metrics_table():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                create table if not exists cw_practice_attempts (
                    id uuid primary key,
                    operator varchar(80) not null,
                    mode varchar(40) not null,
                    drill varchar(80) not null default '',
                    accuracy smallint not null check (accuracy between 0 and 100),
                    correct_characters integer not null check (correct_characters >= 0),
                    total_characters integer not null check (total_characters > 0),
                    wpm smallint not null,
                    farnsworth_wpm smallint not null,
                    duration_seconds double precision not null default 0,
                    missed_characters jsonb not null default '{}'::jsonb,
                    character_scores jsonb not null default '{}'::jsonb,
                    confusions jsonb not null default '{}'::jsonb,
                    training_goal varchar(40),
                    exercise_format varchar(40),
                    audio_effect varchar(40),
                    repeat_count smallint,
                    group_size smallint,
                    strict_spacing boolean,
                    timed_minutes smallint,
                    play_count smallint,
                    revealed_before_check boolean,
                    session_id varchar(80),
                    character_attempts jsonb not null default '{}'::jsonb,
                    character_correct jsonb not null default '{}'::jsonb,
                    missing_count integer,
                    incorrect_count integer,
                    extra_count integer,
                    created_at timestamptz not null default now()
                )
                """
            )
            cur.execute(
                """
                alter table cw_practice_attempts
                add column if not exists character_scores jsonb not null default '{}'::jsonb
                """
            )
            cur.execute(
                """
                alter table cw_practice_attempts
                    add column if not exists play_count smallint,
                    add column if not exists revealed_before_check boolean,
                    add column if not exists session_id varchar(80),
                    add column if not exists character_attempts jsonb not null default '{}'::jsonb,
                    add column if not exists character_correct jsonb not null default '{}'::jsonb,
                    add column if not exists missing_count integer,
                    add column if not exists incorrect_count integer,
                    add column if not exists extra_count integer
                """
            )
            cur.execute(
                """
                alter table cw_practice_attempts
                add column if not exists confusions jsonb not null default '{}'::jsonb
                """
            )
            cur.execute(
                """
                alter table cw_practice_attempts
                    add column if not exists training_goal varchar(40),
                    add column if not exists exercise_format varchar(40),
                    add column if not exists audio_effect varchar(40),
                    add column if not exists repeat_count smallint,
                    add column if not exists group_size smallint,
                    add column if not exists strict_spacing boolean,
                    add column if not exists timed_minutes smallint
                """
            )
            cur.execute(
                """
                create index if not exists cw_practice_attempts_operator_created_idx
                on cw_practice_attempts (operator, created_at desc)
                """
            )


def ensure_cw_operators_table():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                create table if not exists cw_operators (
                    callsign varchar(16) primary key,
                    name varchar(80) not null default '',
                    qth varchar(120) not null default '',
                    rig varchar(120) not null default '',
                    antenna varchar(120) not null default '',
                    power varchar(40) not null default '',
                    settings jsonb not null default '{}'::jsonb,
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now()
                )
                """
            )
            cur.execute(
                """
                insert into cw_operators (
                    callsign,
                    name,
                    qth,
                    rig,
                    antenna,
                    power
                )
                values ('AF0FR', 'TAYLOR', 'OAKVILLE MO', 'XIEGU G90', 'EFHW', '20W')
                on conflict (callsign) do nothing
                """
            )


def ensure_net_control_state_table():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                create table if not exists net_control_state (
                    id varchar(40) primary key,
                    payload jsonb not null default '{}'::jsonb,
                    updated_at timestamptz not null default now()
                )
                """
            )
            cur.execute(
                """
                insert into net_control_state (id, payload)
                values ('current', '{}'::jsonb)
                on conflict (id) do nothing
                """
            )


def _ensure_net_control_sessions_table():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                create table if not exists net_control_sessions (
                    id varchar(80) primary key,
                    name varchar(160) not null default '',
                    status varchar(20) not null default 'saved',
                    opening_script text not null default '',
                    traffic_prompt text not null default '',
                    late_checkin_prompt text not null default '',
                    closing_script text not null default '',
                    saved_at timestamptz,
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now()
                )
                """
            )


def ensure_gateway_cw_tables():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                create table if not exists gateway_cw_sessions (
                    id uuid primary key,
                    status varchar(16) not null default 'live',
                    scheduled boolean not null default false,
                    started_by varchar(16) not null,
                    announcement varchar(280) not null default '',
                    started_at timestamptz not null default now(),
                    ended_at timestamptz,
                    updated_at timestamptz not null default now()
                )
                """
            )
            cur.execute(
                """
                create table if not exists gateway_cw_interest (
                    email varchar(254) primary key,
                    created_at timestamptz not null default now()
                )
                """
            )
            cur.execute(
                """
                create table if not exists gateway_cw_bands (
                    id uuid primary key,
                    session_id uuid not null references gateway_cw_sessions(id) on delete cascade,
                    band varchar(12) not null,
                    position smallint not null,
                    status varchar(16) not null default 'upcoming',
                    frequency varchar(24) not null default '',
                    question varchar(280) not null default '',
                    ncs_callsign varchar(16) not null default '',
                    ncs_qth varchar(64) not null default '',
                    reported_by varchar(16) not null default '',
                    started_at timestamptz,
                    ended_at timestamptz,
                    updated_at timestamptz not null default now(),
                    unique (session_id, position)
                )
                """
            )
            cur.execute(
                "alter table gateway_cw_bands add column if not exists ncs_qth varchar(64) not null default ''"
            )
            cur.execute(
                """
                create table if not exists gateway_cw_checkins (
                    id uuid primary key,
                    session_id uuid not null references gateway_cw_sessions(id) on delete cascade,
                    band_id uuid not null references gateway_cw_bands(id) on delete cascade,
                    callsign varchar(16) not null,
                    preferred_speed smallint,
                    checkin_type varchar(16) not null default 'direct',
                    relayed_by varchar(16) not null default '',
                    entered_by varchar(16) not null,
                    qso_status varchar(16) not null default 'pending',
                    closed_by varchar(16) not null default '',
                    closed_at timestamptz,
                    created_at timestamptz not null default now(),
                    unique (band_id, callsign)
                )
                """
            )
            cur.execute(
                """
                alter table gateway_cw_checkins
                    add column if not exists qso_status varchar(16) not null default 'closed',
                    add column if not exists closed_by varchar(16) not null default '',
                    add column if not exists closed_at timestamptz
                """
            )
            cur.execute(
                "alter table gateway_cw_checkins alter column qso_status set default 'pending'"
            )
            cur.execute(
                """
                create table if not exists gateway_cw_chat (
                    id uuid primary key,
                    session_id uuid not null references gateway_cw_sessions(id) on delete cascade,
                    band_id uuid not null references gateway_cw_bands(id) on delete cascade,
                    callsign varchar(16) not null,
                    message varchar(280) not null,
                    created_at timestamptz not null default now()
                )
                """
            )
            cur.execute(
                """
                create index if not exists gateway_cw_sessions_started_idx
                on gateway_cw_sessions (started_at desc)
                """
            )
            cur.execute(
                """
                create index if not exists gateway_cw_chat_band_created_idx
                on gateway_cw_chat (band_id, created_at)
                """
            )
            cur.execute(
                """
                insert into net_control_sessions (id, name, status)
                values ('current', 'Current net', 'active')
                on conflict (id) do nothing
                """
            )
            cur.execute(
                """
                create table if not exists net_control_roster_members (
                    id varchar(120) primary key,
                    callsign varchar(32) not null default '',
                    name varchar(160) not null default '',
                    city varchar(160),
                    notes text,
                    status varchar(20) not null default 'visitor',
                    source varchar(20) not null default 'manual',
                    lat double precision,
                    lng double precision,
                    distance_miles double precision,
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now()
                )
                """
            )
            cur.execute(
                """
                create unique index if not exists net_control_roster_callsign_idx
                on net_control_roster_members (callsign)
                where callsign <> ''
                """
            )
            cur.execute(
                """
                create table if not exists net_control_checkins (
                    session_id varchar(80) not null references net_control_sessions(id) on delete cascade,
                    id varchar(80) not null,
                    callsign varchar(32) not null default '',
                    name varchar(160) not null default '',
                    location varchar(160),
                    distance double precision,
                    traffic_type varchar(20) not null default 'regular',
                    club_status varchar(20) not null default 'visitor',
                    visitor boolean not null default true,
                    member boolean not null default false,
                    member_id varchar(120),
                    first_time boolean not null default false,
                    notes text,
                    station_status varchar(20) not null default 'waiting',
                    check_in_time timestamptz not null default now(),
                    position integer not null default 0,
                    created_at timestamptz not null default now(),
                    updated_at timestamptz not null default now(),
                    primary key (session_id, id)
                )
                """
            )
            cur.execute(
                """
                create index if not exists net_control_checkins_session_position_idx
                on net_control_checkins (session_id, position)
                """
            )
            cur.execute(
                """
                create table if not exists net_control_queue_entries (
                    session_id varchar(80) not null references net_control_sessions(id) on delete cascade,
                    station_id varchar(80) not null,
                    position integer not null default 0,
                    created_at timestamptz not null default now(),
                    primary key (session_id, station_id)
                )
                """
            )
            cur.execute(
                """
                create table if not exists net_control_log_entries (
                    session_id varchar(80) not null references net_control_sessions(id) on delete cascade,
                    id varchar(80) not null,
                    timestamp timestamptz not null default now(),
                    type varchar(20) not null default 'info',
                    message text not null default '',
                    station_id varchar(80),
                    position integer not null default 0,
                    created_at timestamptz not null default now(),
                    primary key (session_id, id)
                )
                """
            )

def ensure_net_control_tables():
    _ensure_net_control_sessions_table()
    ensure_gateway_cw_tables()


def initialize_schema():
    ensure_cw_metrics_table()
    ensure_cw_operators_table()
    ensure_net_control_state_table()
    ensure_net_control_tables()
