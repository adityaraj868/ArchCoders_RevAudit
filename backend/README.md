# RevAudit Backend

Express API server for RevAudit. The server skeleton, database layer, JWT
authentication, presentation version management, and file upload (to local
disk or AWS S3, behind a swappable storage abstraction) are implemented. See
the project's system architecture plan for the full API surface and AWS
deployment design, and [`DEPLOYMENT.md`](DEPLOYMENT.md) for the step-by-step
AWS EC2 deployment runbook.

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
| `npm run seed-admin` | Create (or promote) the HEAD_ADMIN account — see [User management](#user-management--role-hierarchy) |

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
│   ├── controllers/         # auth, admin, user, presentation, file, health
│   ├── routes/              # Express routers, mounted under /api
│   ├── models/              # Sequelize models: User, Presentation, File, AuditLog
│   ├── middleware/
│   │   ├── authenticateUser.js    # verifies the JWT, loads the user, sets req.user
│   │   ├── authorizeRole.js       # role gate, used after authenticateUser
│   │   ├── attachUserIfPresent.js # optional-auth: never blocks, just identifies admins
│   │   ├── upload.js              # multer config: memory storage, size/type limits
│   │   ├── rateLimit.js           # throttles /auth/login and /auth/register
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── services/
│   │   ├── auth.service.js         # register/login business logic
│   │   ├── user.service.js         # HEAD_ADMIN user-management + audit logging
│   │   ├── presentation.service.js # version create/list/get/update rules
│   │   ├── file.service.js         # links an upload to a presentation
│   │   └── storage/                # storage abstraction — see below
│   │       ├── index.js             # picks a driver by STORAGE_DRIVER
│   │       ├── localStorageService.js
│   │       └── s3StorageService.js  # AWS S3, private bucket + signed URLs
│   └── utils/
│       ├── logger.js         # leveled, timestamped console logger
│       ├── AppError.js       # operational-error class for controllers to throw
│       ├── asyncHandler.js   # forwards async controller rejections to next()
│       └── jwt.js            # signs/verifies access tokens
├── migrations/               # sequelize-cli migrations (users, presentations, files, audit_logs, role hierarchy)
├── seeders/                  # sequelize-cli seed data (empty for now)
├── scripts/
│   └── seed-admin.js          # the only way to create a HEAD_ADMIN account
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

Four Sequelize models, one Postgres schema in production:

### User

| Field | Type | Rules |
|---|---|---|
| `name` | string | required, 2–100 chars |
| `email` | string | required, unique, valid email, lowercased on save |
| `passwordHash` | string | required, 8–100 chars **as submitted** — **hashed with bcrypt before save**, never returned by a default query |
| `role` | enum | `HEAD_ADMIN` \| `ADMIN` \| `USER`, defaults to `USER` |
| `createdBy` | UUID | nullable, self-referential FK to `users.id` — who created this account (`null` for self-registered USERs and the seeded HEAD_ADMIN) |

`User.scope('withPassword')` is required to read the hash back (e.g. for
login) — every other query gets it stripped automatically.

**HEAD_ADMIN is structurally protected**, not just by the API: a
`beforeUpdate` hook rejects *any* attempt to change a HEAD_ADMIN's `role`,
and a `beforeDestroy` hook rejects deleting one — both fire regardless of
which code path triggered the change, the same defense-in-depth pattern
used to protect published `Presentation` rows.

### AuditLog

Append-only — nothing in the application ever updates or deletes a row here.

| Field | Type | Rules |
|---|---|---|
| `action` | enum | `CREATE_USER` \| `CHANGE_ROLE` \| `DELETE_USER` |
| `performedBy` | UUID | nullable FK to `users.id` (the actor) |
| `targetUser` | UUID | nullable FK to `users.id` (who the action was about) |
| `details` | JSON | e.g. `{ from: 'USER', to: 'ADMIN' }` for a role change |
| `timestamp` | date | defaults to now |

Both FKs are `ON DELETE SET NULL` — deleting a user later doesn't delete
the history of what they did or what was done to them, it just nulls the
reference.

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
User (1) ──< (N) User           via users.created_by (who created whom)
User (1) ──< (N) AuditLog       via audit_logs.performed_by
User (1) ──< (N) AuditLog       via audit_logs.target_user
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
hour, payload includes `role`) that the client sends back as
`Authorization: Bearer <token>`.

**There is no way to create an ADMIN or HEAD_ADMIN account through the
public API.** `POST /api/auth/register` always creates a `USER`, even if
the request body includes `"role": "ADMIN"` or `"role": "HEAD_ADMIN"` — the
field is ignored server-side. This is deliberate: a public endpoint must
never be able to self-grant elevated access. Elevated accounts only ever
come from a HEAD_ADMIN via `POST /api/admin/users` (see
[User management](#user-management--role-hierarchy)) — and HEAD_ADMIN
itself only ever comes from the seed script:

```bash
HEAD_ADMIN_EMAIL="admin@example.com" \
HEAD_ADMIN_PASSWORD="a-strong-password" \
npm run seed-admin
```

`HEAD_ADMIN_NAME` is optional (defaults to `"Head Admin"`). Running this
against an email that already exists promotes that account to HEAD_ADMIN
instead of erroring — which is also how an already-deployed database's
existing `admin` account becomes HEAD_ADMIN, via the role-hierarchy
migration (see below) rather than needing this script re-run.

### How a request gets authorized

1. `authenticateUser` reads the `Authorization` header, verifies the JWT's
   signature and expiry, then **re-loads the user from the database** by the
   token's subject — a deleted *or role-changed* account stops being valid
   on its very next request, rather than staying valid until the token
   expires on its own.
2. `authorizeRole('ADMIN', 'HEAD_ADMIN')` (or any other role list) runs
   after `authenticateUser` and checks `req.user.role`. Route files apply
   both with a single `router.use(authenticateUser, authorizeRole(...))` —
   a new route just gets added to the file and inherits the gate
   automatically.
3. Login and register are both rate-limited (10 requests / 15 minutes / IP)
   against credential stuffing and account-creation spam.

### Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | none | Create an account. Always `role: "USER"` regardless of request body. |
| `POST` | `/api/auth/login` | none | `{ email, password }` → `{ user, token }`. Same `401` message whether the email doesn't exist or the password is wrong. |
| `GET` | `/api/auth/me` | any valid token | Returns the authenticated user's own profile. |
| `GET` | `/api/admin/dashboard` | token + `ADMIN`/`HEAD_ADMIN` | Presentation counts (total/published/draft) — proves the auth chain protects a real, DB-backed route. |

## User management & role hierarchy

Three roles, strictly ordered:

| Role | Dashboard | Manage presentations/files | Manage users | Notes |
|---|---|---|---|---|
| `HEAD_ADMIN` | ✅ | ✅ | ✅ (create ADMIN/USER, change roles, remove) | Exactly one in practice; seeded, never created via the API; cannot be deleted or demoted, by anyone, including itself |
| `ADMIN` | ✅ | ✅ | ❌ | Created only by a HEAD_ADMIN |
| `USER` | ❌ | ❌ | ❌ | Default role for public registration; ordinary application access only |

### Endpoints — all under `/api/admin/users`, all HEAD_ADMIN-only

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/users` | Create a user. `{ name, email, password, role }` — `role` must be `ADMIN` or `USER`; `HEAD_ADMIN` is rejected with `400` even for the actual HEAD_ADMIN, since this endpoint is never how that role comes to exist. `createdBy` is always the caller. |
| `GET` | `/api/admin/users` | List every user (all roles, all accounts). |
| `PATCH` | `/api/admin/users/:id/role` | Change a user's role to `ADMIN` or `USER`. `403` if the target is a HEAD_ADMIN — that role can't be changed by this route, full stop. |
| `DELETE` | `/api/admin/users/:id` | Remove a user. `400` if you target your own account, `403` if the target is a HEAD_ADMIN, `404` if the id doesn't exist. |

Every one of these is checked at two independent layers: the service
(`src/services/user.service.js`) rejects the HEAD_ADMIN-related cases with
a clear `AppError` before touching the database, and the `User` model's own
hooks (above) would reject the same thing again even if some other code
path tried to bypass the service.

### Privilege-escalation guards, explicitly

- Registration ignores any `role` in the request body (already covered above).
- `POST /api/admin/users` and `PATCH .../role` both validate the role
  against an explicit allow-list (`ADMIN`, `USER`) — there is no way to
  reach `HEAD_ADMIN` through either endpoint, closing off "promote myself
  to HEAD_ADMIN via a role change" as a path entirely.
- `authenticateUser` re-checks the database every request, so a demoted
  admin's existing token stops granting admin access on their very next
  request — not just the next time they log in.

### Audit log

Every `CREATE_USER`, `CHANGE_ROLE`, and `DELETE_USER` writes one
`AuditLog` row (see [Database layer → AuditLog](#auditlog)) before the
underlying change is made — for a deletion, this means the log captures
who was deleted and their role even though the `users` row itself is gone
a moment later. There's no read endpoint for this table yet; it exists to
be queried directly (`psql`, or a future admin UI) rather than through the
API.

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
| `POST` | `/api/presentations` | token + `ADMIN`/`HEAD_ADMIN` | Create a new version. `title`, `version`, `date`, `authors` required; `changeSummary` and `published` optional. `createdBy` is always the caller, never taken from the body. |
| `GET` | `/api/presentations` | public (optional) | List versions — published-only unless the caller is an admin. |
| `GET` | `/api/presentations/:id` | public (optional) | Fetch one version. |
| `PUT` | `/api/presentations/:id` | token + `ADMIN`/`HEAD_ADMIN` | Update `authors`, `date`, `changeSummary`, or `published`. Any `title`/`version` in the body is silently ignored — see below. Fails with `409` if the version is already published. |

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

## File upload

### Storage abstraction

`src/services/storage/index.js` picks a driver by the `STORAGE_DRIVER` env
var (`local` or `s3`); both implement the same two functions:

```
save({ buffer, originalName, presentationId, mimeType }) -> { filename, storagePath }
getUrl(storagePath, { expiresInSeconds? }) -> string | Promise<string>
```

Nothing above the storage layer (`file.service.js`, the controller, the
route) knows or cares which driver is active. The driver modules are
required *lazily*, by path, based on `STORAGE_DRIVER` — `s3StorageService`
validates its own AWS config the moment it's loaded, and that must only
happen when `s3` is actually selected, or the zero-config `local` default
would fail to start without AWS credentials it doesn't need.

Multer (`src/middleware/upload.js`) uses `memoryStorage()` — it only parses
multipart form data into buffers in memory; it never touches disk itself.
That's what makes the storage driver swap possible: multer's job stops at
"here are the bytes and metadata," and everything after that is the storage
service's decision.

**`local`** writes to disk under `UPLOAD_DIR` (default `backend/uploads/`,
git-ignored), namespaced by presentation id. `getUrl()` returns a plain
`/uploads/...` path.

**`s3`** uploads to the bucket named by `AWS_BUCKET_NAME`, same
presentation-id namespacing, via `@aws-sdk/client-s3`. No object ACL is ever
set — **the bucket is expected to stay private**; `getUrl()` returns a
time-limited *signed* URL (`@aws-sdk/s3-request-presigner`, 1 hour default)
rather than a bare bucket URL, so a private bucket is still usable by the
frontend without making anything world-readable.

#### Credentials — IAM-safe by construction

- Read once from `process.env` via `config/env.js` (`AWS_ACCESS_KEY`,
  `AWS_SECRET_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`) — never hardcoded,
  never logged, never echoed back in any API response. Every response and
  log line was checked by hand during integration testing; none contained
  the secret key.
- Use an IAM user scoped to exactly this bucket, nothing more:

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }]
  }
  ```

  Not a root key, not `s3:*`, not `Resource: "*"`.
- `AWS_S3_ENDPOINT` (optional) points the SDK at an S3-compatible endpoint
  instead of real AWS — used below for MinIO, and equally applicable to
  other S3-compatible providers. Leave it unset for real AWS.

### Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/files/upload` | token + `ADMIN`/`HEAD_ADMIN` | Multipart upload. Field `presentationId` (required) plus one or more files under the field name `files`. Response includes a fresh `url` per file. |
| `GET` | `/api/files/:id/url` | public (optional) | Mint a fresh signed URL for one file. Same visibility rule as presentations: resolvable by anyone if the file's presentation is published, admin-only otherwise. Not cached — S3 signed URLs expire, so this is a live lookup every time. |

Request shape (`multipart/form-data`):

```
presentationId: <uuid>
files: <file>       (repeat the "files" field for multiple files —
                      a folder upload is just the browser expanding a
                      directory picker into several files client-side)
```

### Validation

- **Type** — checked against the same `File.ALLOWED_MIME_TYPES` allow-list
  the database model already enforces (PDF, PPT/PPTX, ZIP, PNG/JPEG/SVG) —
  defined once, used by both multer's `fileFilter` and the model, so they
  can't drift apart.
- **Size** — `MAX_UPLOAD_SIZE_MB` per file (default 25) and
  `MAX_FILES_PER_UPLOAD` per request (default 20), enforced by multer.
- **Presentation state** — the target presentation must exist (`404` if
  not) and must not already be `published` (`409` if it is) — a published
  version's file set is frozen along with everything else about it, for the
  same reason `PUT` stops working on it.

### Metadata storage

Each uploaded file becomes one `File` row (`filename`, `originalName`,
`storagePath`, `size`, `type`, `presentationId`, `uploadedBy`) — the schema
already built in the database layer. A multi-file request creates one row
per file, all linked to the same `presentationId`.

### How the S3 driver is tested

Two layers, deliberately separate:

- **`tests/s3Storage.test.js`** (part of `npm test`) mocks the S3 client
  with `aws-sdk-client-mock` — no network, no real AWS, no dependency on
  anything being installed or running. This is what CI and a fresh clone
  run. It asserts the right bucket/key/`ContentType` get sent, that no ACL
  is ever set, and that `getUrl()` produces a real signed URL (URL signing
  is computed locally by the SDK, not a network call, so this runs against
  the mocked client with fake credentials and still produces a genuine
  signature).
- **A one-off live verification**, run once by hand against
  [MinIO](https://min.io) (a real S3-protocol server) with the actual `aws`
  CLI, independent of the application:

  ```bash
  minio server /tmp/minio-data --address :9100 --console-address :9101 &
  export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...
  aws --endpoint-url http://localhost:9100 s3 mb s3://revaudit-test-bucket

  # STORAGE_DRIVER=s3, AWS_S3_ENDPOINT=http://localhost:9100, same bucket —
  # then through the real API: login → create presentation → upload a file.

  aws --endpoint-url http://localhost:9100 s3 ls s3://revaudit-test-bucket --recursive
  aws --endpoint-url http://localhost:9100 s3api head-object --bucket revaudit-test-bucket --key <key>
  curl <the signed URL the API returned>   # bytes matched the original file
  curl <the same object, no signature>     # 403 AccessDenied — confirms the bucket is actually private
  ```

  This confirmed, independently of the app's own claims: the object lands
  in the bucket with the right size and content type, the signed URL
  returns the exact original bytes, an unsigned request to the same object
  is rejected, and the secret key never appeared in any log line or
  response body.

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

Auth, role-based user management, the database layer, presentation version
management, and file upload (local disk or S3) are done. Still missing:
refresh tokens / logout revocation (the current access token can't be
invalidated before it expires — there's no session table yet, unlike the
fuller design in the system architecture plan), a read endpoint for the
audit log (it's queryable directly in the database today, not through the
API), and a CloudFront-fronted public URL for S3 objects (the signed URLs
work today but bypass the CDN layer the AWS architecture plan calls for).
