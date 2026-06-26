# Table Tennis Tournament

Monorepo with strict separation between:

- `frontend`: UI/layout/components + API client
- `backend`: API + tournament business logic
- `deploy`: infra and container runtime config

Current tournament format is Swiss system only, with support for 10-30 participants and multi-day progression.

## Stack

- Backend: NestJS + TypeScript
- Frontend: React + TypeScript + Vite + Tailwind + React Router + TanStack Query
- Infra: Docker Compose (`dev` and `prod`) + PostgreSQL + nginx

## Quick Start

1. Create env file:

```bash
cp .env.example .env
```

2. Start development:

```bash
docker compose -f docker-compose.dev.yml up --build
```

3. Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`

Services in development compose:

- `backend-dev`
- `frontend-dev`
- `postgres`

## Production Compose

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

- nginx entrypoint: `http://localhost:8080`

## Swiss Rules Implemented

- Tournament is round-based Swiss pairing.
- Loss does not eliminate a participant.
- Round count is configurable (`roundsCount` on tournament).
- Tournament may continue across multiple days while staying `in_progress`.
- Next round generation is explicit organizer action.
- Win gives `1` point.
- `bye` gives `1` point.
- `bye` does not count as an opponent for Buchholz.
- Standings are sorted by points, then Buchholz.
- Pairing avoids repeated opponents when possible; fallback rematches are explicit when unavoidable.

Participant limits:

- Draft can exist with any participant count.
- Start is allowed only with 10-30 participants.
- Adding the 31st participant is rejected.

## UI Model

- Public tournament page shows current round, round history, and standings.
- Standings include points and Buchholz.
- Admin flow supports:
  - participant registration/import in `draft`;
  - tournament start (seed/start);
  - match result entry by round;
  - next-round generation;
  - tournament finish.

## Data Source Switching

Frontend data source is controlled by `VITE_DATA_SOURCE`:

- `mock` — UI uses local mock repository
- `api` — UI uses backend API repository

Default in `.env.example` is `api`.

## Participants CSV Import

Admin UI supports CSV import on `/admin/participants`.

- Allowed only when tournament status is `draft`.
- Supported columns (RU/EN headers): nickname, tribe, telegram.
- Tribes are accepted as `comet|satellite|star` and `Комета|Спутник|Звезда`.

Sample file with 20 participants:

- `examples/google-forms-participants-20.csv`

## Active Tournament

- Admin panel has a tournaments screen at `/admin/tournaments`.
- Only one tournament can be active at a time.
- Public pages and admin pages for participants/matches/audit use the active tournament scope.

## Prisma and Schema Workflow (Docker)

Run inside dev containers:

```bash
docker compose -f docker-compose.dev.yml exec backend-dev npx prisma validate
docker compose -f docker-compose.dev.yml exec backend-dev npx prisma generate
docker compose -f docker-compose.dev.yml exec backend-dev npx prisma migrate dev --name <migration_name>
docker compose -f docker-compose.dev.yml exec backend-dev npx prisma migrate status
```
