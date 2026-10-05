# Mathogic Mock Test

A React/Vite frontend and Flask/SQLite backend for timed practice tests in
general knowledge, verbal reasoning, and logical aptitude. Students create an
account, wait for approval, and take only the tests assigned by an admin.

## Requirements

- Node.js and npm
- Python 3.10+

## First-time setup

1. Copy `.env.example` to `.env` in the repository root. Set a random
   `SESSION_SECRET_KEY` and a private `ADMIN_EMAIL` / `ADMIN_PASSWORD` pair.
   The admin password must be at least 12 characters. `.env` is ignored by
   Git; never share or commit it.
2. Install backend requirements and start Flask:

   ```powershell
   cd backend
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   py api.py
   ```

   On first startup, the backend creates the admin account from `ADMIN_EMAIL`
   and `ADMIN_PASSWORD`. Sign in at `/account` with those credentials, then
   open `/admin`. The initial admin password is hashed in the database and is
   not printed by the app.
3. In a second terminal, start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. Vite proxies `/api` to Flask on port 5000.

## Student and admin workflow

- Students register at `/account`. New accounts are pending until an admin
  approves them and assigns access to one or more tests.
- Student sign-in and registration are at `/account`; administrator sign-in is
  at `/admin-login`. Each login endpoint only accepts its matching account
  role.
- Students sign in to see assigned tests and their previous attempts.
- Admins sign in at `/admin-login`, then use `/admin` to approve or suspend
  students, set per-test access, review attempts and answers, and adjust a
  final score.
- Every score adjustment requires a reason. The automatic score is preserved,
  and each override is retained in an audit history.
- Student accounts use email/password and password hashes. Sessions are
  server-signed cookies with CSRF protection. The initial admin account is
  created only when no admin with the configured email exists.

## Configuration

- `SESSION_SECRET_KEY`: required, private signing key for browser sessions.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: initial administrator credentials.
- `FRONTEND_ORIGINS`: comma-separated origins allowed by the API.
- `SESSION_COOKIE_SECURE`: set to `true` when serving the app over HTTPS.
- `FLASK_DEBUG`: set to `true` only for local debugging; disabled by default.
- `PORT`: API port; defaults to `5000`.
- `DATABASE_URL`: optional SQLAlchemy database URL; defaults to
  `backend/instance/answers.db`.
- `VITE_API_BASE_URL`: optional frontend API base URL. Defaults to `/api`,
  which Vite proxies in development and the production reverse proxy should
  route to Flask.

Changing `ADMIN_PASSWORD` in `.env` does not reset an existing administrator's
password. Use an authorized password-reset workflow before deploying this
demo for real users.

## Scoring

Answer keys are kept server-side in `backend/answer_key.py`. Answers are
normalized for case, punctuation, and accents, with accepted variants for
short-answer questions. Every question is worth one point, and unanswered
questions remain in the score denominator.

## Checks

```powershell
cd frontend
npm run lint
npm run build
cd ..\backend
py -m unittest
```

## Production notes

Use HTTPS, set a strong session key and administrator password, enable secure
session cookies, restrict `FRONTEND_ORIGINS` to the deployed frontend, and
route `/api` to Flask through a same-origin reverse proxy. Back up the database
and protect it as it contains account details, attempts, reports, and score
audit history. This demo does not yet include email verification, password
reset, or multi-factor authentication.
