# AF0FR

Standalone home for [af0fr.com](https://af0fr.com): amateur-radio projects, station tools, CW practice, logging, net control, and signal-report mapping.

The application was extracted from `iftaylor.com/AF0FR` while preserving the existing frontend features and FastAPI contract.

## Structure

```text
.
├── src/       Angular 19 standalone frontend with Tailwind CSS 4
└── backend/   FastAPI application backed by PostgreSQL
```

## Frontend

```bash
npm install
npm start
```

The development app runs at `http://localhost:4200` and uses the local API at `http://localhost:8000`. `npm start` uses a polling file watcher to work on Linux systems whose inotify watcher pool is already exhausted. Use `npm run start:native-watch` if native filesystem watching is available and preferred.

Production currently continues to use the existing Render API so the domain migration does not require a simultaneous backend cutover. Change `src/environments/environment.prod.ts` when the AF0FR API hostname is ready.

Public routes:

- `/` — AF0FR home and projects
- `/cw` — CW copy trainer
- `/logbook` — station logbook
- `/net-control` — net-control desk
- `/signal` — signal-report and azimuth map
- `/qsl-card` — QSL card demo

Legacy `/af0fr/...` paths redirect to their new equivalents inside this app.

## Backend

The backend requires Python 3.12+ and PostgreSQL.

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload
```

Alternatively, install with Poetry and run `poetry run uvicorn app.main:app --reload`.

Required configuration:

- `DATABASE_URL` — PostgreSQL connection URL
- `ALLOWED_ORIGINS` — comma-separated browser origins; defaults include `af0fr.com`, `www.af0fr.com`, and local Angular development

## Domain migration

Configure the old host to issue permanent redirects:

```text
iftaylor.com/AF0FR             -> https://af0fr.com/
iftaylor.com/AF0FR/cw_qso      -> https://af0fr.com/cw
iftaylor.com/AF0FR/logbook     -> https://af0fr.com/logbook
iftaylor.com/AF0FR/net_control -> https://af0fr.com/net-control
iftaylor.com/AF0FR/signal      -> https://af0fr.com/signal
iftaylor.com/AF0FR/card_demo   -> https://af0fr.com/qsl-card
```

Those redirects must be configured in the old site's hosting project; this repository cannot redirect requests that still terminate at `iftaylor.com`.

## Security note

Several API endpoints modify shared data and currently have no authentication. Before advertising the operator tools publicly, protect write operations for net control, CW profiles, roster data, and signal-map records. CORS controls browser origins but is not authentication.
