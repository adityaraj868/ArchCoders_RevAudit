# RevAudit Backend

Express API server for RevAudit. The server skeleton, database layer, JWT
authentication, and presentation version management are implemented; file
upload to S3 is not built yet. See the project's system architecture plan
for the full API surface and AWS deployment design.

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
| `npm run create-admin` | Create (or promote) an admin account — see [Authentication](#authentication) |

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
│   ├── controllers/         # auth, admin, presentation, health
│   ├── routes/              # Express routers, mounted under /api
│   ├── models/              # Sequelize models: User, Presentation, File
│   ├── middleware/
│   │   ├── requireAuth.js         # verifies the JWT, loads the user, sets req.user
│   │   ├── requireRole.js         # role gate, used after requireAuth
│   │   ├── attachUserIfPresent.js # optional-auth: never blocks, just identifies admins
│   │   ├── rateLimit.js           # throttles /auth/login and /auth/register
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── services/
│   │   ├── auth.service.js         # register/login business logic
│   │   └── presentation.service.js # version create/list/get/update rules
│   └── utils/
│       ├── logger.js         # leveled, timestamped console logger
│       ├── AppError.js       # operational-error class for controllers to throw
│       ├── asyncHandler.js   # forwards async controller rejections to next()
│       └── jwt.js            # signs/verifies access tokens
├── migrations/               # sequelize-cli migrations (users, presentations, files)
├── seeders/                  # sequelize-cli seed data (empty for now)
├── scripts/
│   └── create-admin.js        # the only way to create an admin account
├── tests/                    # Jest suite, run against in-memory SQLite
├── .sequelizerc              # points sequelize-cli at the folders above
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
| `title` | string | required, ≤200 chars — **immutable after creation** |
| `version` | string | required, must look like `1`, `1.0`, or `2.3.1` — **immutable after creation** |
| `authors` | string[] | required, at least one non-empty name — stored as a JSON string column (see below) |
| `date` | date | required |
| `changeSummary` | text | optional, ≤2000 chars |
| `published` | boolean | defaults to `false` — **once `true`, the entire row is frozen** |
| `createdBy` | UUID | required, references `users.id` |

`(title, version)` has a unique index — the same version label can't be
created twice under the same title. Two hooks enforce version-history
integrity directly in the model, so no code path (API or otherwise) can
violate it:

- `beforeUpdate` rejects any attempt to change `title` or `version` — ever,
  regardless of publish state — and rejects *any* change at all once
  `published` was already `true`. A published version is completely frozen;
  the only legal transition is unpublished → published, once.
- `beforeDestroy` blocks deleting a published row.

This is what makes "uploading v2" structurally incapable of touching v1:
there is no field through which a client could repoint an existing row at
different content, and publishing a row takes it out of reach of every
future write.

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

## Authentication

JWT-based, stateless — no session table, no refresh tokens yet. A successful
login/register returns a signed access token (`JWT_EXPIRES_IN`, default 1
hour) that the client sends back as `Authorization: Bearer <token>`.

**There is no way to create an admin account through the API.**
`POST /api/auth/register` always creates a `viewer`, even if the request
body includes `"role": "admin"` — the field is ignored server-side. This is
deliberate: a public endpoint must never be able to self-grant elevated
access. To create the first admin (or promote an existing user), run:

```bash
ADMIN_NAME="Dr. Sukhpal Singh" \
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="a-strong-password" \
npm run create-admin
```

### How a request gets authorized

1. `requireAuth` reads the `Authorization` header, verifies the JWT's
   signature and expiry, then **re-loads the user from the database** by the
   token's subject — a deleted account is rejected immediately rather than
   staying valid until the token expires on its own.
2. `requireRole('admin')` (or any other role list) runs after `requireAuth`
   and checks `req.user.role`. `src/routes/admin.routes.js` applies both to
   every route in the file with a single `router.use(requireAuth,
   requireRole('admin'))` — a new admin-only route just gets added to that
   file and inherits the gate automatically.
3. Login and register are both rate-limited (10 requests / 15 minutes / IP)
   against credential stuffing and account-creation spam.

### Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | none | Create an account. Always `role: "viewer"` regardless of request body. |
| `POST` | `/api/auth/login` | none | `{ email, password }` → `{ user, token }`. Same `401` message whether the email doesn't exist or the password is wrong. |
| `GET` | `/api/auth/me` | any valid token | Returns the authenticated user's own profile. |
| `GET` | `/api/admin/dashboard` | token + `admin` role | Presentation counts (total/published/draft) — proves the auth chain protects a real, DB-backed route. |

## Presentation management

Every presentation *version* is its own row — there is no separate
"presentation" parent record. Creating v2 of a title never touches v1's row;
they coexist under the same `title` with different `version` values. See
[Database layer → Presentation](#presentation) for exactly how the model
enforces this at the data layer.

### Visibility

- `GET /api/presentations` and `GET /api/presentations/:id` are **public** —
  no token required.
- An anonymous (or non-admin) caller only ever sees `published: true`
  versions. An authenticated admin sees everything, drafts included.
- Requesting an unpublished version's `:id` as a non-admin returns `404`,
  the same as if it didn't exist at all — a draft's existence isn't
  confirmed to callers who can't see it.

### Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/presentations` | token + `admin` role | Create a new version. `title`, `version`, `date`, `authors` required; `changeSummary` and `published` optional. `createdBy` is always the caller, never taken from the body. |
| `GET` | `/api/presentations` | public (optional) | List versions — published-only unless the caller is an admin. |
| `GET` | `/api/presentations/:id` | public (optional) | Fetch one version. |
| `PUT` | `/api/presentations/:id` | token + `admin` role | Update `authors`, `date`, `changeSummary`, or `published`. Any `title`/`version` in the body is silently ignored — see below. Fails with `409` if the version is already published. |

There is deliberately **no `DELETE` route** — nothing about this feature
ever removes a version.

### Why PUT can't be used to rewrite history

`title` and `version` are never read from the request body by the
controller at all, so there's no way to send them through this API even by
accident. The model's `beforeUpdate` hook is a second, independent
safeguard against the same thing — it throws if either field is changed by
any means, and separately throws if *any* field is changed on a row that
was already published. Publishing is therefore a one-way door: a version
goes draft → published exactly once, and after that `PUT` on it always
fails with `409`, admin or not.

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

Auth, the database layer, and presentation version management are done.
Still missing: actual file upload (the `File` model and its S3 storage path
exist, but nothing in `presentation.routes.js` accepts a file yet — versions
are metadata-only for now), and refresh tokens / logout revocation (the
current access token can't be invalidated before it expires — there's no
session table yet, unlike the fuller design in the system architecture
plan).
