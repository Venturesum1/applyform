# Job Application Portal

A simple, fast job application portal: a public candidate application page and a
password-protected recruiter dashboard for reviewing applications, viewing resumes,
and updating candidate status.

## 1. Project Overview

Two experiences, one app:

- **Candidates** open the site, fill out a single-page application form, upload a
  PDF resume, review what they entered, and submit — no account required.
- **Recruiters/Admins** log in to a dashboard, search/filter/sort submitted
  applications, open a candidate's full profile, view their resume inline (no
  download required), and move them through a simple status pipeline.

Tech stack: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui on the
frontend, Next.js API routes on the backend, MongoDB (via Mongoose) for storage,
and a pluggable file-storage abstraction for resumes (local disk in development).

## 2. Requirements

- Node.js 20+
- A MongoDB connection string (MongoDB Atlas or self-hosted)

## 3. Environment Setup

Copy the example file and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. |
| `ADMIN_EMAIL` | The single admin account's email. |
| `ADMIN_PASSWORD_HASH_BASE64` | Base64-encoded bcrypt hash of the admin password. Generate with `npm run hash-password`. |
| `SESSION_SECRET` | Random 32+ character string used to encrypt the admin session cookie. Generate with `openssl rand -base64 32`. |
| `FILE_STORAGE_PROVIDER` | `local` (default). See [File Storage Configuration](#7-file-storage-configuration). |
| `RESUME_STORAGE_DIR` | Filesystem directory for stored resumes when using the local provider. Must be outside `public/`. |

**Important:** `ADMIN_PASSWORD_HASH_BASE64` must be base64, not a raw
`$2b$12$...` bcrypt string. Next.js's env loader expands `$word` patterns in
`.env` files, and a raw bcrypt hash frequently contains a segment that looks
like a variable reference — it will be silently corrupted if pasted in directly.
Always generate this value with the script below.

## 4. MongoDB Configuration

Any standard MongoDB deployment works. For MongoDB Atlas:

1. Create a cluster and a database user.
2. Allow network access from your IP (or `0.0.0.0/0` for quick local testing only).
3. Copy the connection string into `MONGODB_URI` in `.env.local`.

The `Application` collection is created automatically on first write, with
indexes on `email` (unique — this is what backs duplicate-application
prevention), `createdAt`, `status`, and `fullName`.

## 5. Local Development

```bash
npm install
npm run dev
```

- Candidate application page: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

## 6. Admin Login Setup

There is no admin registration UI — the single admin account is configured
entirely through environment variables.

1. Generate a password hash:
   ```bash
   npm run hash-password -- "your-strong-password"
   ```
2. Copy the printed `ADMIN_PASSWORD_HASH_BASE64=...` line into `.env.local`.
3. Set `ADMIN_EMAIL` in `.env.local` to the admin's email.
4. Restart the dev server and sign in at `/admin/login`.

To change the password later, re-run the script and replace the value.

## 7. File Storage Configuration

Resumes are never stored inside `public/` and are never served as static
files — every resume is streamed through an authenticated API route
(`/api/admin/applications/:id/resume`) after verifying the requester has an
admin session.

`src/lib/storage/types.ts` defines a small `FileStorage` interface
(`save` / `read` / `delete`). Two providers are implemented, selected via
`FILE_STORAGE_PROVIDER`:

- **`local`** (default) — writes files to `RESUME_STORAGE_DIR` under a
  randomly generated filename; the original uploaded filename is never used
  to build a filesystem path. **Development only.** This does not work when
  deployed to Vercel (or any other serverless/ephemeral host) — the
  filesystem isn't guaranteed to persist or be shared across invocations, so
  an uploaded resume can silently become unreadable later.
- **`vercel-blob`** — stores resumes as **private** Vercel Blob objects
  (`access: "private"`), which require the store's read-write token to read
  — they are not fetchable from a bare URL the way a "public" blob is. Use
  this in production when deploying to Vercel:
  1. In your Vercel project dashboard, go to **Storage → Create → Blob** and
     connect a store to the project. Vercel then injects
     `BLOB_READ_WRITE_TOKEN` into your deployment automatically.
  2. Set `FILE_STORAGE_PROVIDER=vercel-blob` in your Vercel project's
     environment variables.

In both cases, the client never receives a direct file URL — every resume
request goes through the authenticated `/api/admin/applications/:id/resume`
route, which checks the admin session, then reads the bytes from whichever
provider is configured and streams them back.

To use a different provider (S3, GCS, Azure Blob, etc.), implement
`FileStorage` for it and add a branch in `src/lib/storage/index.ts`. No other
code needs to change.

## 8. Production Considerations

- Set `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH_BASE64`, and
  `SESSION_SECRET` as real secrets in your hosting provider's environment
  configuration — never commit them.
- Set `FILE_STORAGE_PROVIDER=vercel-blob` (see [File Storage
  Configuration](#7-file-storage-configuration)) — the local filesystem
  provider does not work across multiple server instances or ephemeral
  containers, which includes Vercel.
- Run behind HTTPS — the session and CSRF cookies are marked `Secure` in
  production, so they require it.
- The login rate limiter is in-memory and per-instance. If you deploy more
  than one server instance, replace it with a shared store (e.g. Redis)
  behind the same function signature in `src/lib/auth/rate-limit.ts`.

## 9. Security Notes

- **Authentication:** single admin account, bcrypt-hashed password (never
  stored in plaintext), encrypted/signed session cookie (`iron-session`),
  `HttpOnly` + `Secure` (in production) + `SameSite=strict` cookie attributes.
- **CSRF:** double-submit cookie pattern for all state-changing admin
  requests (status updates, logout) — the client must echo a non-HttpOnly
  CSRF cookie back as an `x-csrf-token` header.
- **Rate limiting:** failed admin login attempts are rate-limited per client IP
  (identified via the `X-Forwarded-For` header). This assumes you deploy behind
  a reverse proxy or platform (Vercel, nginx, an ALB, etc.) that sets this
  header itself and strips any client-supplied value — true for most standard
  Next.js hosting. If you expose the app directly to the internet without such
  a proxy, a client could spoof this header to bypass the per-IP limit.
- **File uploads:** resumes are validated by MIME type, file extension,
  maximum size, and — most importantly — their actual byte content (PDF
  magic number), since MIME type and extension are attacker-controlled.
- **Path traversal:** resume storage keys are server-generated UUIDs;
  uploaded filenames are never used to build filesystem paths, and every
  storage key is re-validated against a strict pattern before any disk
  access.
- **IDOR / authorization:** every admin API route independently verifies
  the admin session (defense in depth beyond the dashboard's route guard);
  route parameters are validated as well-formed MongoDB ObjectIds before
  ever reaching a database query.
- **Injection:** MongoDB queries only ever place validated/whitelisted
  values into filters; free-text search input is regex-escaped before use.
- **No public admin registration:** the admin account only comes from
  environment variables / the seed script above.
- **No fake data:** the app never fabricates candidates, applications, or
  statistics — the dashboard only ever reflects what is actually stored in
  MongoDB.

## Testing

```bash
npm run typecheck
npm run lint
npm test
```

Tests cover candidate application validation (required fields, email
format, resume MIME/extension/magic-byte checks, duplicate-email
prevention), admin authentication (login, rate limiting, timing-safe
failure messages), and API authorization (every admin route rejects
unauthenticated requests, rejects malformed IDs before they reach the
database, and enforces CSRF tokens on state-changing requests).
