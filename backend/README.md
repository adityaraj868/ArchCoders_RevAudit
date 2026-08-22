# RevAudit Backend

Express API server for RevAudit. No feature routes exist yet beyond a health
check — this repo currently holds the server skeleton and the database
layer (models, migrations, validation, relationships) it will be built on.
See the project's system architecture plan for the full API surface and AWS
deployment design.

## Stack

- Node.js + Express
- PostgreSQL in development/production, via Sequelize (`sequelize` + `pg`)
- SQLite in-memory for the test suite (see [Database layer](#database-layer))
- `helmet`, `cors`, `morgan` for baseline security/CORS/request logging

## Getting started

```bash
cd backend
npm install
cp .env.example .env   # adjust values for your local setup
npm run dev
```

The server starts even without a reachable database — a failed database
connection is logged as a warning, not a crash, since the connection is only
verified lazily. Point `DATABASE_URL` at a real PostgreSQL instance, then run
the migrations, once one exists:

```bash
npm run migrate
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start with `nodemon` (auto-restart on file changes) |
| `npm start` | Start once, no watcher — for production |
| `npm test` | Run the model test suite against in-memory SQLite |
| `npm run migrate` | Apply pending migrations to `DATABASE_URL` |
| `npm run migrate:undo` | Roll back the most recent migration |

## Folder structure

```
backend/
├── src/
│   ├── server.js         # process entrypoint — starts the HTTP server
│   ├── app.js             # Express app: middleware stack + route mounting
│   ├── config/
│   │   ├── env.js          # loads & validates environment variables
│   │   ├── database.js     # Sequelize config per NODE_ENV (dev/test/prod)
│   │   └── db.js           # exports the Sequelize instance + a health check
│   ├── controllers/        # request handlers (currently: health checks only)
│   ├── routes/             # Express routers, mounted under /api
│   ├── models/             # Sequelize models: User, Presentation, File
│   ├── middleware/          # errorHandler, notFound
│   ├── services/           # business logic layer (empty — no features yet)
│   └── utils/
│       ├── logger.js        # leveled, timestamped console logger
│       └── AppError.js      # operational-error class for controllers to throw
├── migrations/              # sequelize-cli migrations (users, presentations, files)
├── seeders/                 # sequelize-cli seed data (empty for now)
├── tests/                   # Jest model tests, run against in-memory SQLite
├── .sequelizerc             # points sequelize-cli at the folders above
├── package.json
├── .env.example
└── README.md
```

## Environment variables

See [`.env.example`](.env.example). `DATABASE_URL` and `CORS_ORIGIN` are
required when `NODE_ENV=production`; sensible localhost defaults are used
otherwise so the server can start with zero configuration in development.

## Database layer

Three Sequelize models, one Postgres schema in production:

### User

| Field | Type | Rules |
|---|---|---|
| `name` | string | required, 2–100 chars |
| `email` | string | required, unique, valid email, lowercased on save |
| `password` | string | required, 8–100 chars — **hashed with bcrypt before save**, never returned by a default query |
| `role` | enum | `admin` \| `viewer`, defaults to `viewer` |

`User.scope('withPassword')` is required to read the hash back (e.g. for a
future login endpoint) — every other query gets it stripped automatically.

### Presentation

| Field | Type | Rules |
|---|---|---|
| `title` | string | required, ≤200 chars |
| `version` | string | required, must look like `1`, `1.0`, or `2.3.1` |
| `authors` | string[] | required, at least one non-empty name — stored as a JSON string column (see below) |
| `date` | date | required |
| `description` | text | optional, ≤2000 chars |
| `status` | enum | `draft` \| `uploading` \| `processing` \| `uploaded` \| `published` \| `failed`, defaults to `draft` |
| `createdBy` | UUID | required, references `users.id` |

`(title, version)` has a unique index — the same deck can't be published
twice under the same version label. A `beforeDestroy` hook blocks deleting
any presentation whose `status` is `published`, matching the "publishing
never overwrites or deletes an earlier version" rule from the architecture
plan — draft/failed rows can still be cleaned up.

`authors` is a JSON-encoded `TEXT` column rather than a native Postgres
`ARRAY`, specifically so the exact same model works against the SQLite
database the test suite uses — SQLite has no array type. A getter/setter
pair makes this transparent: reading `presentation.authors` always returns a
real JS array.

### File

| Field | Type | Rules |
|---|---|---|
| `filename` | string | required |
| `originalName` | string | required |
| `storagePath` | string | required |
| `size` | bigint | required, > 0 bytes |
| `type` | string | required, must be one of the allow-listed MIME types (`File.ALLOWED_MIME_TYPES`) |
| `presentationId` | UUID | required, references `presentations.id` |
| `uploadedBy` | UUID | required, references `users.id` |

### Relationships

```
User (1) ──< (N) Presentation   via presentations.created_by
User (1) ──< (N) File           via files.uploaded_by
Presentation (1) ──< (N) File   via files.presentation_id
```

Deleting a user is restricted while they still have presentations or files
attached (`onDelete: RESTRICT`) — history doesn't silently disappear.
Deleting a presentation cascades to its files (`onDelete: CASCADE`), but
in practice a published presentation can never reach that point because of
the `beforeDestroy` guard above.

### Why SQLite for tests instead of a real Postgres

`npm test` runs the full model/validation/association suite against an
in-memory SQLite database (`src/config/database.js`, `test` block) rather
than requiring a live Postgres instance for CI or local development. The
column types were chosen to behave identically on both engines (notably the
JSON-text `authors` column above), so the tests genuinely exercise the same
model code that runs against Postgres in development and production — the
storage engine underneath is the only thing that differs.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness check — always returns `200` if the process is up |
| `GET` | `/api/health/db` | Attempts a database query; `200` if connected, `503` if not |

## Error handling

Every route error should be passed to `next(err)` (or thrown inside an
`async` handler wrapped to catch rejections). `AppError` marks an error as
operational (safe to show its message to the client); anything else is
reported to the client as a generic `Internal server error` and logged with
its full stack trace.

## Not implemented yet

The database layer exists (models, migrations, validation, relationships),
but nothing in `controllers/`, `routes/`, or `services/` uses it yet — there
is still no login endpoint, no upload endpoint, and no presentation-publish
endpoint. That's the next layer to build on top of this schema.
