# AGENTS.md

## 1. Project Overview

This repository contains an application for organizing table tennis events and tournaments.

The application is intended for a small club environment. Typical tournaments include 10–30 participants and may span one or multiple days.

The system may support several event formats over time, but the primary tournament format is currently the **Swiss system**.

Core features:

* tournament creation and lifecycle management;
* participant registration;
* seeding and pair generation;
* Swiss-system round generation;
* match result entry;
* standings and statistics;
* tournament history;
* Telegram-related integrations and notifications;
* responsive UI suitable for desktop and mobile usage.

Do not introduce unnecessary abstractions or enterprise-level complexity. The project should remain maintainable after MVP while preserving a clear path for future extensions.

---

## 2. Technology Stack

### Backend

* Node.js
* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* class-validator
* class-transformer

### Frontend

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* Zustand for local UI state when necessary
* Tailwind CSS

### Infrastructure

* Docker
* Docker Compose
* PostgreSQL container
* `.env` configuration

Use the package manager already configured in the repository. Do not switch package managers or introduce a second lock file.

---

## 3. General Working Rules

Before modifying code:

1. Inspect the repository structure.
2. Read the existing `README.md`, package scripts, environment examples, Prisma schema, migrations, and tests.
3. Identify the affected modules and existing conventions.
4. Reuse existing patterns unless they are clearly defective.
5. Prefer small, reviewable changes over broad rewrites.
6. Run relevant tests, linters, type checks, and builds after changes.

Do not:

* invent API endpoints without checking existing routing conventions;
* duplicate business logic in controllers and React components;
* add dependencies when the same result can be achieved with the existing stack;
* hardcode credentials, secrets, URLs, ports, Telegram tokens, or database settings;
* modify unrelated files;
* silently change business rules;
* leave dead code, unused imports, obsolete DTOs, or outdated UI components after refactoring.

When requirements are ambiguous, inspect the codebase first. If the ambiguity cannot be resolved from the repository, state the assumption explicitly in the final report.

---

## 4. Repository Structure

Prefer a monorepo-like layout when the project already follows it:

```text
/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── test/
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

Do not restructure the repository unless the task explicitly requires it.

---

## 5. Backend Architecture

Use NestJS modules to separate domain responsibilities.

Recommended modules:

```text
src/
├── app.module.ts
├── common/
├── config/
├── prisma/
├── tournaments/
├── participants/
├── matches/
├── bracket/
├── standings/
├── statistics/
└── telegram/
```

### Module responsibilities

#### `tournaments`

Responsible for:

* tournament creation;
* tournament configuration;
* tournament lifecycle;
* start and finish operations;
* round count configuration;
* validation of tournament-level actions.

#### `participants`

Responsible for:

* participant registration;
* participant updates before tournament start;
* participant removal before tournament start;
* participant listing;
* participant tournament membership.

#### `matches`

Responsible for:

* match persistence;
* match result updates;
* score validation;
* match state transitions;
* round completion checks.

#### `bracket`

Responsible for:

* pairing logic;
* Swiss-system round generation;
* seeding;
* opponent-history checks;
* `bye` selection;
* deterministic pairing rules;
* fallback pairing logic when an ideal pairing cannot be produced.

The pairing algorithm must be isolated from controllers and persistence details.

#### `standings`

Responsible for:

* tournament points;
* Buchholz calculation;
* wins and losses;
* `bye` count;
* ranking;
* tie-break rules.

#### `statistics`

Responsible for:

* aggregate tournament statistics;
* participant performance statistics;
* historical metrics;
* read-only reporting endpoints.

#### `telegram`

Responsible for:

* Telegram bot integration;
* notifications;
* event announcements;
* configuration via environment variables.

Telegram integration must not be tightly coupled to tournament core logic. Use services or events so the domain remains usable without Telegram.

---

## 6. Layering Rules

Follow the standard NestJS separation of concerns.

### Controllers

Controllers must:

* define HTTP routes;
* receive validated DTOs;
* extract route parameters;
* call application services;
* return response objects.

Controllers must not:

* implement pairing logic;
* calculate standings;
* access Prisma directly;
* contain complex branching;
* build SQL queries manually.

### Services

Services must:

* implement business rules;
* coordinate domain operations;
* access repositories or Prisma services;
* use transactions where necessary;
* throw typed application exceptions.

Avoid oversized services. Split responsibilities when a service starts mixing unrelated domains.

### DTOs

All externally received data must use DTOs.

DTOs must:

* use `class-validator`;
* use explicit types;
* reject invalid enum values;
* validate required and optional fields;
* enforce numeric ranges;
* validate UUIDs or IDs according to the existing database model;
* avoid exposing internal persistence structures directly.

Do not trust frontend validation. Backend validation is mandatory.

### Prisma access

Prefer using a shared `PrismaService`.

Do not instantiate `PrismaClient` in individual modules.

Use Prisma transactions for multi-step state changes, including:

* tournament start;
* first-round generation;
* next-round generation;
* match result update when standings-related state is persisted;
* tournament completion.

---

## 7. Domain Model

The concrete Prisma schema may evolve, but the domain must preserve the following concepts.

### Tournament

Suggested fields:

```ts
id
name
status
roundsCount
currentRound
format
createdAt
updatedAt
```

Recommended status values:

```ts
DRAFT
IN_PROGRESS
FINISHED
```

Recommended format values:

```ts
SWISS
```

If future compatibility is required, additional formats may be added later. Do not keep obsolete double-elimination structures unless they remain actively supported.

### Participant

Suggested fields:

```ts
id
name
telegramUsername
createdAt
updatedAt
```

A participant may be connected to tournaments through an explicit join model.

### TournamentParticipant

Suggested fields:

```ts
id
tournamentId
participantId
seed
createdAt
updatedAt
```

Computed values such as tournament points and Buchholz should be derived unless the repository already persists aggregates intentionally.

### Round

Suggested fields:

```ts
id
tournamentId
number
status
createdAt
updatedAt
```

Recommended status values:

```ts
PENDING
IN_PROGRESS
FINISHED
```

### Match

Suggested fields:

```ts
id
roundId
playerOneId
playerTwoId
winnerId
status
playerOneSets
playerTwoSets
createdAt
updatedAt
```

Recommended status values:

```ts
PENDING
FINISHED
BYE
```

For a `BYE` match:

* `playerTwoId` is `null`;
* the participant receives one tournament point;
* the match cannot be edited as a regular match;
* the match does not add an opponent for Buchholz calculation.

---

## 8. Swiss-System Rules

The Swiss-system implementation is a central part of the application.

### General rules

* Participants do not leave the tournament after a loss.
* All participants play a predefined number of rounds.
* Recommended defaults:

  * 10–15 participants: 4 or 5 rounds;
  * 16–23 participants: 5 rounds;
  * 24–30 participants: 5 or 6 rounds.
* A win gives 1 tournament point.
* A loss gives 0 tournament points.
* A `bye` gives 1 tournament point.

### First round

* Shuffle participants or use seeding according to tournament configuration.
* Generate pairs.
* If the participant count is odd, assign one `bye`.
* If randomness is used, make it testable by accepting a seed or injectable randomizer.

### Subsequent rounds

When generating the next round:

1. Sort participants by tournament points descending.
2. Use Buchholz descending as the secondary criterion.
3. Pair participants primarily within the same score group.
4. Move participants to adjacent score groups when required.
5. Avoid repeated opponents whenever a valid arrangement exists.
6. Use repeated opponents only as an explicit fallback.
7. Assign `bye` to the lowest-ranked eligible participant when the participant count is odd.
8. Do not assign a second `bye` to a participant while another participant has not received one.

### Buchholz

Buchholz is calculated as the sum of the current tournament points of all actual opponents previously faced by the participant.

Rules:

* `bye` does not count as an opponent;
* Buchholz must be recalculated after result changes;
* Buchholz is used as a tie-breaker;
* do not calculate it in React components.

### Final ranking

Sort participants by:

1. tournament points descending;
2. Buchholz descending;
3. optional set difference descending;
4. stable technical fallback such as participant ID or name.

The same ranking rules must be used consistently by the backend and displayed by the frontend.

---

## 9. Pairing Algorithm Requirements

Implement pairing logic in a dedicated service or pure domain module.

Example location:

```text
src/bracket/services/swiss-pairing.service.ts
```

The pairing algorithm should accept a domain-level input:

```ts
type SwissPairingParticipant = {
  participantId: string;
  points: number;
  buchholz: number;
  previousOpponentIds: string[];
  byeCount: number;
};
```

Expected output:

```ts
type SwissPairingResult = {
  pairs: Array<{
    playerOneId: string;
    playerTwoId: string;
  }>;
  byeParticipantId?: string;
  usedFallbackRematch: boolean;
};
```

Requirements:

* deterministic for identical inputs, except optional seeded first-round shuffle;
* covered by unit tests;
* independent of HTTP;
* independent of React;
* independent of Prisma query objects;
* capable of handling 10-30 participants;
* readable and maintainable.

Prefer a backtracking-based approach for subsequent rounds. Use pruning and score-group heuristics so pairing remains responsive up to 30 participants.

Suggested approach:

1. sort participants using standing order;
2. remove the selected `bye` participant if needed;
3. pick the first remaining participant;
4. try candidate opponents in preferred order;
5. prioritize same-score candidates;
6. reject previous opponents during the primary pass;
7. recurse until all participants are paired;
8. if no valid arrangement exists, run a fallback pass allowing rematches;
9. mark fallback usage in the result for observability.

Do not create duplicate matches or pair a participant with themselves.

---

## 10. Match Rules

Default table tennis match format:

* a game is played to 11 points;
* serve changes every 2 serves;
* at 10:10, play continues until a player leads by 2 points;
* a match is played until 2 game wins;
* the typical final set score is `2:0` or `2:1`.

At MVP level, the application may store only won sets:

```ts
playerOneSets: 0 | 1 | 2
playerTwoSets: 0 | 1 | 2
```

Validation rules:

* exactly one player must have 2 sets;
* the losing player may have 0 or 1 set;
* both players cannot have 2 sets;
* a player not participating in the match cannot be set as winner;
* a `BYE` match cannot be edited;
* completed-tournament matches cannot be edited unless a dedicated correction flow exists.

---

## 11. API Design

Use REST unless the repository already uses another approach.

Recommended route style:

```text
/api/tournaments
/api/tournaments/:tournamentId
/api/tournaments/:tournamentId/participants
/api/tournaments/:tournamentId/start
/api/tournaments/:tournamentId/rounds
/api/tournaments/:tournamentId/rounds/:roundNumber
/api/tournaments/:tournamentId/rounds/next
/api/tournaments/:tournamentId/standings
/api/tournaments/:tournamentId/finish
/api/matches/:matchId/result
```

Follow existing naming conventions if they differ.

### Typical operations

#### Tournament management

```text
POST   /api/tournaments
GET    /api/tournaments
GET    /api/tournaments/:id
PATCH  /api/tournaments/:id
POST   /api/tournaments/:id/start
POST   /api/tournaments/:id/finish
```

#### Participants

```text
GET     /api/tournaments/:id/participants
POST    /api/tournaments/:id/participants
DELETE  /api/tournaments/:id/participants/:participantId
```

#### Rounds

```text
GET   /api/tournaments/:id/rounds
GET   /api/tournaments/:id/rounds/:roundNumber
POST  /api/tournaments/:id/rounds/next
```

#### Matches

```text
PATCH  /api/matches/:id/result
```

#### Standings

```text
GET  /api/tournaments/:id/standings
```

Use proper HTTP status codes:

* `200 OK` for successful reads and updates;
* `201 Created` for resource creation;
* `204 No Content` for successful deletion when no body is returned;
* `400 Bad Request` for malformed input;
* `404 Not Found` for missing resources;
* `409 Conflict` for invalid state transitions;
* `422 Unprocessable Entity` when request data is structurally valid but violates domain rules, if this convention is already used in the repository.

Return consistent error response structures.

---

## 12. Backend Business Constraints

Enforce the following rules on the backend:

* participants can only be added or removed while a tournament is in `DRAFT`;
* a tournament cannot start with fewer than 2 participants;
* a tournament cannot start twice;
* the next round cannot be generated until all regular matches in the current round are completed;
* the next round cannot be generated twice;
* no more rounds may be generated than `roundsCount`;
* a tournament cannot finish before its final round is completed;
* results cannot be changed after tournament completion unless a correction workflow is explicitly implemented;
* `bye` is assigned automatically;
* `bye` results cannot be modified manually;
* a participant cannot appear twice in one round;
* repeated pairings must be avoided unless no valid alternative exists.

Use domain-specific exceptions and clear user-facing messages.

---

## 13. Frontend Architecture

Prefer a feature-based frontend structure.

Example:

```text
src/
├── app/
│   ├── router/
│   └── providers/
├── api/
├── components/
├── features/
│   ├── tournaments/
│   ├── participants/
│   ├── rounds/
│   ├── matches/
│   └── standings/
├── pages/
├── stores/
├── types/
└── utils/
```

Keep components focused.

Do not:

* store server state manually in Zustand if TanStack Query already manages it;
* duplicate API response types in several features;
* calculate authoritative standings in the browser;
* implement pairing logic in frontend code;
* fetch data directly inside deeply nested presentational components.

---

## 14. Frontend State Management

### TanStack Query

Use TanStack Query for:

* tournament lists;
* tournament details;
* participant lists;
* rounds;
* current pairings;
* standings;
* match result mutations;
* tournament lifecycle mutations.

After mutations, invalidate only relevant queries.

Example:

```ts
queryClient.invalidateQueries({
  queryKey: ['tournaments', tournamentId, 'standings'],
});
```

### Zustand

Use Zustand only for local UI state when needed, such as:

* selected round tab;
* open modal state;
* local filters;
* temporary draft state;
* confirmation dialogs.

Do not use Zustand as a replacement for TanStack Query.

---

## 15. Frontend UI Requirements

The interface must work on desktop and mobile.

### Tournament page

Show three primary blocks.

#### Current round

Display:

* round number, for example `Round 3 of 5`;
* participant pairs;
* match status;
* result input;
* `bye` participant;
* button to generate the next round;
* button to finish the tournament after the last round.

Example:

```text
Round 2 of 4

Anna       2 : 1  Ilya
Maria      — : —  Oleg
Dmitry     0 : 2  Svetlana
Sergey     bye
```

#### Round history

Use tabs or a compact list:

```text
Round 1 | Round 2 | Round 3 | Round 4
```

#### Standings

Display:

| Place | Participant | Played | Wins | Losses | Bye | Points | Buchholz |
| ----: | ----------- | -----: | ---: | -----: | --: | -----: | -------: |

Highlight final places after tournament completion.

### UX rules

* disable participant editing after tournament start;
* disable the next-round button until all results are entered;
* ask for confirmation before generating the next round;
* show `Skips this round and receives 1 point` for `bye`;
* display backend validation errors clearly;
* keep mobile layouts readable;
* avoid complex visual bracket lines for Swiss-system tournaments.

---

## 16. Tailwind CSS Rules

Use Tailwind utility classes consistently.

Prefer:

* simple cards;
* responsive grids;
* clear spacing;
* accessible contrast;
* visible disabled states;
* compact tables;
* readable mobile layouts.

Avoid:

* inline styles unless unavoidable;
* deeply nested wrappers;
* arbitrary one-off values without reason;
* excessive animation;
* desktop-only layouts.

Reuse existing shared components for:

* buttons;
* inputs;
* modals;
* tables;
* badges;
* alerts;
* loading states;
* empty states.

---

## 17. Database and Prisma Rules

Use PostgreSQL and Prisma migrations.

### Required rules

* modify `schema.prisma` deliberately;
* generate a migration for schema changes;
* use explicit relation names when ambiguity exists;
* add indexes for commonly queried fields;
* add unique constraints where required by the domain;
* avoid nullable fields unless they represent valid domain states;
* do not use raw SQL unless Prisma cannot express the required operation cleanly;
* review generated migrations before applying them.

Typical indexes:

```prisma
@@index([tournamentId])
@@index([roundId])
@@index([participantId])
@@unique([tournamentId, number])
```

For participant membership:

```prisma
@@unique([tournamentId, participantId])
```

For matches, consider constraints or service-level validation preventing duplicate participant usage within one round.

Do not edit already-applied production migrations unless the repository explicitly uses that workflow. Add a new migration.

---

## 18. Environment Configuration

Use environment variables for all environment-specific values.

Example:

```env
DATABASE_URL=
PORT=
FRONTEND_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Maintain `.env.example`.

Never commit:

* real Telegram tokens;
* database passwords;
* production URLs with credentials;
* private keys;
* secrets;
* personal data.

Read environment variables through NestJS configuration utilities rather than direct ad hoc access across the codebase.

---

## 19. Error Handling

Use consistent backend errors.

Expected examples:

```text
Tournament has already started
Participants cannot be changed after tournament start
Current round contains unfinished matches
Next round has already been generated
Tournament has reached the configured round limit
Bye match result cannot be edited
Winner must be one of the match participants
Tournament cannot be finished before the final round is completed
```

Frontend must display meaningful messages returned by the backend.

Do not expose:

* stack traces;
* raw database errors;
* Prisma internals;
* environment values.

---

## 20. Testing Requirements

Add or update tests for any changed behavior.

### Backend unit tests

Focus on:

* Swiss pairing;
* standings;
* Buchholz;
* `bye` selection;
* validation;
* tournament lifecycle;
* state transitions.

### Backend integration or e2e tests

Cover:

* tournament creation;
* participant registration;
* tournament start;
* first-round generation;
* result entry;
* next-round generation;
* final standings;
* finish operation.

### Required Swiss pairing scenarios

Test at minimum:

1. first round generation for an even participant count;
2. first round generation for an odd participant count;
3. automatic `bye` assignment;
4. 1 point awarded for a win;
5. 1 point awarded for `bye`;
6. no repeated `bye` while eligible participants without `bye` remain;
7. second-round generation after completing the first round;
8. rejection of next-round generation while matches remain unfinished;
9. prevention of repeated opponents when a valid pairing exists;
10. fallback rematch when no other valid combination exists;
11. correct Buchholz calculation;
12. standings sorted by points and Buchholz;
13. participant changes rejected after tournament start;
14. result updates rejected after tournament completion;
15. full tournament simulation with 10 participants and 4 rounds;
16. full tournament simulation with 20 participants and 5 rounds;
17. full tournament simulation with 30 participants and 6 rounds.

### Frontend tests

When frontend testing tools already exist, cover:

* tournament form;
* participant list;
* match result entry;
* current round rendering;
* `bye` rendering;
* standings rendering;
* disabled next-round button;
* API error display.

Do not add a large frontend testing stack unless requested.

---

## 21. Code Style

### TypeScript

Use:

* strict typing;
* explicit return types for public service methods;
* enums or string literal unions for domain statuses;
* meaningful names;
* small focused functions;
* immutable transformations where practical;
* async/await;
* centralized shared types where appropriate.

Avoid:

* `any`;
* non-null assertions without justification;
* large controller methods;
* deeply nested conditionals;
* duplicated literals;
* magic numbers;
* implicit state mutations;
* broad `catch` blocks that hide errors.

### NestJS

Prefer:

* constructor injection;
* feature modules;
* DTO validation;
* typed exceptions;
* interceptors and guards only when they solve a cross-cutting concern;
* Prisma transactions for multi-step writes.

### React

Prefer:

* functional components;
* hooks;
* TanStack Query hooks grouped by feature;
* controlled forms;
* explicit loading, empty, and error states;
* semantic HTML;
* accessible controls.

Avoid:

* oversized page components;
* business logic embedded in JSX;
* ad hoc fetch calls;
* duplicated server data in local state;
* unnecessary global state.

---

## 22. Logging

Log meaningful domain-level events:

* tournament created;
* tournament started;
* round generated;
* fallback rematch used;
* match result updated;
* tournament finished;
* Telegram notification failed.

Do not log:

* secrets;
* Telegram tokens;
* database connection strings;
* sensitive personal data;
* full request bodies by default.

Use the existing logging mechanism. Do not introduce a new logger dependency unless required.

---

## 23. Commands

Before finalizing changes, inspect package scripts and run the relevant commands.

Typical backend commands:

```bash
npm install
npm run lint
npm run test
npm run test:e2e
npm run build
npx prisma validate
npx prisma generate
npx prisma migrate dev
```

Typical frontend commands:

```bash
npm install
npm run lint
npm run build
```

Typical Docker commands:

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=100
```

Use only commands appropriate for the current task and repository.

Do not run destructive database commands without explicit permission.

---

## 24. Migration Workflow

When the Prisma schema changes:

1. inspect the existing schema;
2. update `schema.prisma`;
3. generate a new migration;
4. review migration SQL;
5. run Prisma validation;
6. regenerate Prisma client;
7. run affected tests;
8. document migration name in the final report.

Do not use:

```bash
prisma migrate reset
```

unless explicitly requested and the environment is confirmed to be disposable.

---

## 25. Review Checklist

Before completing a task, verify:

### Backend

* business rules are enforced server-side;
* controllers remain thin;
* DTOs validate incoming data;
* Prisma calls are correct;
* transactions are used where necessary;
* no dead double-elimination logic remains unless intentionally supported;
* Swiss pairing is isolated and tested;
* Buchholz is calculated consistently;
* `bye` handling is correct.

### Frontend

* server state uses TanStack Query;
* local state is not duplicated unnecessarily;
* UI works on mobile;
* loading and error states are handled;
* result entry is validated;
* standings update after mutations;
* round history remains accessible.

### Infrastructure

* `.env.example` is updated if needed;
* no secrets are committed;
* migrations are added correctly;
* Docker configuration remains valid.

### Quality

* tests pass;
* linter passes;
* TypeScript build passes;
* no unused imports;
* no unrelated changes;
* no hidden assumptions.

---

## 26. Final Report Format

After completing a task, provide a concise report with the following sections:

```text
Summary
- What was changed.

Architecture
- Main design decisions.
- Affected modules.

Database
- Prisma schema changes.
- Added migrations.

API
- Added or changed endpoints.
- DTO changes.

Frontend
- Added or changed pages and components.
- Query invalidation and state-management changes.

Tests
- Added or updated tests.
- Commands executed.
- Results.

Open Questions
- Assumptions.
- Known limitations.
- Follow-up items.
```

Mention any command that could not be run and explain why.

---

## 27. Task Execution Principles

For each requested task:

1. inspect before editing;
2. identify the smallest coherent change;
3. preserve established project conventions;
4. keep domain logic outside UI and controllers;
5. validate inputs;
6. add tests for changed behavior;
7. run checks;
8. remove obsolete code;
9. summarize the result accurately.

Do not claim that tests passed unless they were actually executed successfully.
