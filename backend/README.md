# RevAudit Backend

Express API server for RevAudit. This is the architectural skeleton only — no
routes beyond a health check exist yet. See the project's system architecture
plan for the full API surface, database schema, and AWS deployment design
this backend will grow into.

## Stack

- Node.js + Express
- PostgreSQL (via `pg`)
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
verified lazily. Point `DATABASE_URL` at a real PostgreSQL instance once one
exists.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start with `nodemon` (auto-restart on file changes) |
| `npm start` | Start once, no watcher — for production |

## Folder structure

```
backend/
├── src/
│   ├── server.js         # process entrypoint — starts the HTTP server
│   ├── app.js             # Express app: middleware stack + route mounting
│   ├── config/
│   │   ├── env.js          # loads & validates environment variables
│   │   └── db.js           # PostgreSQL connection pool
│   ├── controllers/        # request handlers (currently: health checks only)
│   ├── routes/             # Express routers, mounted under /api
│   ├── models/             # data-access layer (empty — no schema yet)
│   ├── middleware/          # errorHandler, notFound
│   ├── services/           # business logic layer (empty — no features yet)
│   └── utils/
│       ├── logger.js        # leveled, timestamped console logger
│       └── AppError.js      # operational-error class for controllers to throw
├── package.json
├── .env.example
└── README.md
```

## Environment variables

See [`.env.example`](.env.example). `DATABASE_URL` and `CORS_ORIGIN` are
required when `NODE_ENV=production`; sensible localhost defaults are used
otherwise so the server can start with zero configuration in development.

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

Auth, presentations, uploads, and every other feature from the system
architecture plan are intentionally absent. This skeleton only proves the
server starts, connects (or fails gracefully) to Postgres, logs requests, and
handles errors consistently — the foundation the real endpoints get built on.
