# TaskFlow — Task Automation & Job Processing Platform

TaskFlow is a production-oriented MERN task automation module built for the Saarthi AI assessment. It offers secure user accounts with role-based access, task creation and scheduling, asynchronous processing through Redis/BullMQ, cached dashboard data, live status updates over Socket.IO, and a responsive Next.js dashboard with search, filtering, sorting, and pagination.

## Architecture

```text
┌─────────────────────────────┐        REST + Socket.IO        ┌───────────────────────────┐
│  Next.js 15 / React 19      │ ───────────────────────────────▶│  Express 5 API (TS)       │
│  Redux Toolkit (auth state) │ ◀───────────────────────────────│  Zod validation           │
│  TanStack Query (server     │        live task updates        │  JWT auth + refresh       │
│  state, cache, refetch)     │                                  │  RBAC (admin/user)        │
└─────────────────────────────┘                                  └─────────────┬─────────────┘
                                                                                 │
                                                     ┌───────────────────────────┼───────────────────────────┐
                                                     ▼                           ▼                           ▼
                                            ┌────────────────┐         ┌────────────────┐         ┌────────────────┐
                                            │   MongoDB       │         │   Redis         │         │  BullMQ Worker  │
                                            │ users, sessions,│         │ API cache,      │         │  processes task │
                                            │ tasks           │         │ queue backend   │         │  jobs, emits    │
                                            └────────────────┘         └────────────────┘         │  socket updates │
                                                                                                     └────────────────┘
```

## Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Redux Toolkit, TanStack Query, Socket.IO client
- **Backend:** Node.js, Express 5, TypeScript, Zod validation
- **Data:** MongoDB/Mongoose with compound, text, and query indexes
- **Jobs:** Redis 7 and BullMQ with delayed jobs, retries and exponential backoff
- **Security:** bcrypt password hashing, short-lived JWT access tokens, httpOnly rotating refresh tokens, RBAC middleware (`admin` / `user`), Helmet, rate limiting, CORS
- **Testing:** Jest + Supertest integration tests (auth, tasks, admin) against a real MongoDB instance
- **Delivery:** Docker Compose, multi-stage Dockerfiles, GitHub Actions CI

## Run locally

1. Copy `.env.example` to `.env` and set unique JWT secrets.
2. Install dependencies with `npm install`.
3. Start MongoDB and Redis: `docker compose up -d mongodb redis`.
4. Start both applications: `npm run dev`.
5. Open `http://localhost:3000` and register an account, or run `npm run seed -w @taskflow/api` for demo accounts (see below).

For a container-only run, use `docker compose up --build`.

### Demo accounts (after running the seed script)

| Role  | Email                  | Password        |
| ----- | ----------------------- | ---------------- |
| User  | demo@taskflow.local     | DemoPass123!     |
| Admin | admin@taskflow.local    | AdminPass123!    |

## API

All response bodies follow `{ success, data, meta? }` or `{ success: false, error }`.

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Create a user and issue access/refresh tokens | Public |
| POST | `/api/v1/auth/login` | Sign in | Public |
| POST | `/api/v1/auth/refresh` | Rotate the refresh session (httpOnly cookie) | Public |
| POST | `/api/v1/auth/logout` | Revoke the active refresh session | Public |
| GET | `/api/v1/dashboard/summary` | Cached task and queue metrics for the current user | Authenticated |
| GET | `/api/v1/tasks` | Search/filter/sort/paginate the current user's tasks | Authenticated |
| POST | `/api/v1/tasks` | Create a task (multipart, optional attachment) | Authenticated |
| PATCH | `/api/v1/tasks/:id` | Edit an owned task | Authenticated |
| DELETE | `/api/v1/tasks/:id` | Delete an owned task | Authenticated |
| POST | `/api/v1/tasks/:id/retry` | Requeue a failed task | Authenticated |
| GET | `/api/v1/admin/users` | List all users | Admin only |
| GET | `/api/v1/admin/tasks` | List tasks across all users, filterable by status | Admin only |
| GET | `/api/v1/admin/stats` | Platform-wide user and task counts | Admin only |
| GET | `/api/v1/health` | Liveness probe including Redis ping | Public |

`POST /tasks` accepts `title`, optional `description`, optional `priority` (`low`, `medium`, `high`), and optional ISO `scheduledFor`. A title containing `[fail]` deliberately demonstrates worker failure and retry behavior.

The endpoint also accepts multipart form data with an optional `attachment` (JPG, PNG, WEBP, or PDF; maximum 5 MB). Import [the Postman collection](postman/TaskFlow.postman_collection.json) to exercise the full API surface, including auth, tasks, dashboard, and admin routes.

## Folder layout

```text
apps/api/src/
  config/      # env, database, redis connection setup
  middleware/  # auth (JWT + RBAC), centralized error handler, file upload
  models/      # Mongoose schemas: User, Session, Task
  queues/      # BullMQ queue definition + enqueue helper
  routes/      # auth, tasks, dashboard, admin, health
  workers/     # BullMQ worker that processes tasks and emits socket events
  scripts/     # database seed script
  test/        # Jest setup (spins up MongoDB for integration tests)
  utils/       # shared response helpers, JWT helpers

apps/web/src/
  app/          # Next.js App Router entry (layout, page, global styles)
  components/   # Dashboard, AuthPage, TaskForm, TaskFilters, TaskList,
                # TaskItem, Pagination, DashboardStats, QueueHealth, Navbar
  lib/          # typed API client (with silent token refresh), Redux store, hooks

docker-compose.yml
.github/workflows/ci.yml
```

## Frontend features

- Component-based architecture: auth, task creation, filtering, listing, pagination, and queue health are each isolated, reusable components rather than one monolithic page.
- **Silent session refresh**: on load, the app calls `/auth/refresh` using the httpOnly cookie so a page reload doesn't sign the user out. An axios response interceptor also transparently retries any request that hits a `401` after refreshing the access token.
- **Search, filter, sort, and pagination** for the task list, all backed by the corresponding query parameters on `GET /tasks`.
- **Inline task editing** (title/description) in addition to create, delete, and retry.
- Live updates: task status changes (pending → processing → completed/failed) are pushed over Socket.IO and invalidate the relevant TanStack Query caches automatically.
- Accessible form controls (labeled inputs, `role="alert"` on errors, `aria-live` on the task list).

## Role-based access control

Registration always creates a `user`. Admin accounts are provisioned via the seed script (or by updating a user's `role` field directly in MongoDB). Admin-only routes are protected by the same `authenticate` + `authorize('admin')` middleware chain and return `403` for authenticated non-admins and `401` for unauthenticated requests.

## Testing

```bash
npm run test -w @taskflow/api
```

Integration tests use Supertest against the Express app directly (no server/socket boot required) and a real MongoDB instance:

- **Local development**: the test setup uses `mongodb-memory-server`, which downloads a `mongod` binary on first run — this requires outbound internet access to `fastdl.mongodb.org`.
- **CI / sandboxed environments**: set `TEST_MONGO_URI` (and optionally `TEST_REDIS_URL`) to point at an already-running MongoDB/Redis instance instead — the test setup will use it directly and skip the download entirely. `.github/workflows/ci.yml` does exactly this with real `mongo:8` and `redis:7` service containers.

Coverage includes: registration/login/refresh/logout, task CRUD with ownership isolation, search/filter/pagination, retry-only-on-failure, request validation (`400` on bad input via a Zod-aware error handler), and admin RBAC (`401`/`403`/`200` cases).

## Engineering decisions and trade-offs

- **MongoDB** was selected because the requested role is MERN and the task payload is document-shaped. Session metadata is persisted in MongoDB so refresh tokens can be revoked; Redis is still used for API response caching and as the BullMQ backend.
- The worker contains a safe simulated processor so the project is runnable without a third-party integration; replace that function with the target automation logic in production.
- Validation errors (Zod) are normalized to `400` with field-level details via a centralized error-handling middleware, rather than leaking as generic `500`s.
- Admin RBAC is intentionally scoped to read-only oversight routes (`/admin/users`, `/admin/tasks`, `/admin/stats`) rather than allowing admins to mutate other users' tasks, to keep task ownership semantics simple and auditable.

## Known limitations / next improvements

- Move local uploads to cloud object storage and add malware scanning.
- Add a dedicated admin UI (the admin API routes exist but there is currently no admin-only frontend view).
- Add end-to-end tests (Playwright/Cypress) covering the full auth → create → live-update → retry flow through the UI.
- Add refresh-token reuse detection (currently a used refresh token is deleted and reissued, but reuse of a stolen token isn't specifically flagged/alerted).
- `multer@1.x` (used for attachment uploads) is deprecated in favor of `multer@2.x`; a dependency upgrade is recommended before production use.
- Record the requested architecture walkthrough video and publish a live demo link.
