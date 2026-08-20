# Personal Finance Manager

A complete, production-ready personal finance web app: track income, expenses, budgets,
savings goals, recurring transactions, and generate monthly/yearly reports with
data-driven insights. Built to add an expense in under 10 seconds.

## Tech Stack

**Frontend:** React 18, Vite, React Router 6, Axios, Tailwind CSS, Recharts, Lucide Icons
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT auth, bcryptjs, express-validator, helmet, cors, morgan
**Database:** MongoDB Atlas
**Deployment:** Frontend → Vercel · Backend → Render · Database → MongoDB Atlas

## Features

- JWT authentication (register, login, forgot/reset password, profile)
- Quick Add expense/income modal (accessible from every page)
- Full transaction CRUD with search, filters, sorting, pagination
- CSV export and import (with row-level validation and error reporting)
- Categories & payment methods, fully customizable, with safe deletion (reassign-on-delete)
- Monthly budgets with 80%/100% status thresholds and dashboard alerts
- Savings goals with deposit/withdraw and progress tracking
- Recurring transactions (daily/weekly/monthly/yearly) with a self-healing generator —
  never double-creates an occurrence for the same period
- Dashboard with real-time totals, month-over-month % change, category and daily charts
- Monthly & yearly reports with category/payment-method breakdowns and auto-generated
  insights computed from real transaction data (no hard-coded numbers)
- Flexible "Financial Plan" tool for one-off lump-sum planning (e.g. college fund allocation)
- Light/dark/system theme, fully responsive (desktop sidebar, mobile bottom nav)
- Toast notifications, confirm-before-delete modals, loading & empty states throughout

## Folder Structure

```
personal-finance-manager/
  client/                 React + Vite frontend
    src/
      components/         Reusable UI (Modal, QuickAddModal, StatCard, etc.)
      pages/               Route-level pages
      layouts/             Sidebar, Topbar, MobileNav, Layout shell
      context/             Auth, Theme, Toast providers
      services/            Axios API clients, one per resource
      utils/               Formatters (currency, date)
    vite.config.js, vercel.json, .env.example

  server/                  Express + MongoDB backend
    config/db.js           Mongo connection
    models/                 8 Mongoose models
    controllers/            Route handlers
    routes/                  Express routers
    middleware/              auth, error handler, validation
    services/                 defaults seeding, recurring-transaction generator, insights, email
    validators/               express-validator chains
    jobs/recurringJob.js       Hourly job that generates due recurring transactions
    seed/seed.js                Manual demo-data seeder
    __tests__/                   Jest + Supertest API tests

  README.md, .gitignore
```

## Local Setup

### Prerequisites
Node.js 18+, a MongoDB connection (local `mongod` or MongoDB Atlas).

### 1. Backend

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, CLIENT_URL
npm install
npm run dev          # starts on http://localhost:5000
```

Optional: seed a demo user (development only, refuses to run when NODE_ENV=production):
```bash
npm run seed         # creates demo@personalfinance.app / Demo@1234
npm run seed:destroy # removes the demo user and its data
```

### 2. Frontend

```bash
cd client
cp .env.example .env
# edit .env: set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev           # starts on http://localhost:5173
```

Open http://localhost:5173, register an account, and start adding transactions.

### 3. Run backend tests

```bash
cd server
npm test
```
Tests use `mongodb-memory-server` (an in-memory MongoDB) so they don't touch your real database.
Note: the first run needs to download a `mongod` binary — if your environment blocks that
download, point `MONGOMS_DOWNLOAD_URL` / disable the sandbox's network restrictions, or run
the tests against a real local MongoDB instance instead.

## MongoDB Atlas Setup

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. **Database Access** → Add a database user with a username/password (not your Atlas login)
3. **Network Access** → Add IP Address → allow `0.0.0.0/0` (or Render's outbound IPs) so Render can connect
4. **Database** → Connect → Drivers → copy the connection string
5. Paste it into `MONGO_URI` in `server/.env` (and in Render's environment variables), replacing
   `<username>`, `<password>`, and adding your database name, e.g.:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/personal-finance-manager?retryWrites=true&w=majority
   ```

## Deploying the Backend to Render

1. Push this repo to GitHub.
2. On Render: **New → Web Service**, connect the repo, set **Root Directory** to `server`.
3. Build command: `npm install`  ·  Start command: `npm start`
4. Add environment variables (Render dashboard → Environment):
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — a long random string
   - `JWT_EXPIRE` — e.g. `7d`
   - `CLIENT_URL` — your deployed Vercel URL (e.g. `https://your-app.vercel.app`)
   - `NODE_ENV` — `production`
   - (optional) `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for real
     password-reset emails — without these, reset links are logged to the Render logs instead.
5. Render sets `PORT` automatically; the app already reads `process.env.PORT`. Deploy.
6. Note your live backend URL, e.g. `https://personal-finance-manager-api.onrender.com`.

## Deploying the Frontend to Vercel

1. On Vercel: **New Project**, import the repo, set **Root Directory** to `client`.
2. Framework preset: Vite. Build command `npm run build`, output directory `dist` (Vercel
   auto-detects these).
3. Add environment variable: `VITE_API_URL` = `https://YOUR-RENDER-BACKEND.onrender.com/api`
4. Deploy. `vercel.json` is already included so React Router routes survive a page refresh.
5. Once deployed, update `CLIENT_URL` on Render to your Vercel URL and redeploy the backend
   so CORS allows it.

## Environment Variables Reference

**server/.env**
| Variable | Description |
|---|---|
| `PORT` | Server port (Render sets this automatically) |
| `MONGO_URI` | MongoDB Atlas (or local) connection string |
| `JWT_SECRET` | Secret used to sign JWTs — keep this private |
| `JWT_EXPIRE` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin, used for CORS and password-reset links |
| `SMTP_*` | Optional — real email delivery for password reset |

**client/.env**
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

## API Overview

All endpoints are prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

```
POST   /auth/register            POST /auth/login
POST   /auth/forgot-password     POST /auth/reset-password
GET    /auth/me

GET    /transactions             POST /transactions
GET    /transactions/:id         PUT  /transactions/:id      DELETE /transactions/:id
GET    /transactions/export      POST /transactions/import

GET    /dashboard/summary        GET /dashboard/monthly       GET /dashboard/categories

GET    /categories               POST /categories             PUT/DELETE /categories/:id
GET    /payment-methods          POST /payment-methods        PUT/DELETE /payment-methods/:id

GET    /budgets                  POST /budgets                PUT/DELETE /budgets/:id
GET    /goals                    POST /goals                  PUT/DELETE /goals/:id
POST   /goals/:id/deposit        POST /goals/:id/withdraw

GET    /recurring                POST /recurring              PUT/DELETE /recurring/:id

GET    /reports/monthly          GET /reports/yearly
GET    /reports/categories       GET /reports/payment-methods

GET    /plans                    POST /plans                  GET/PUT/DELETE /plans/:id
GET    /notifications            PUT /notifications/:id/read  PUT /notifications/read-all

GET    /users/profile            PUT /users/profile           PUT /users/password
```

Every response follows `{ success, message, data }` on success or `{ success: false, message }`
on error.

## Test Credentials

After running `npm run seed` in `server/`:
- Email: `demo@personalfinance.app`
- Password: `Demo@1234`

(Never seeded automatically, and refuses to run when `NODE_ENV=production`.)

## Troubleshooting

- **CORS errors** — make sure `CLIENT_URL` on the backend exactly matches your frontend's
  origin (protocol + domain, no trailing slash).
- **401 on every request** — check `VITE_API_URL` includes `/api` and the token wasn't cleared;
  try logging out and back in.
- **React Router 404 on refresh (Vercel)** — confirm `client/vercel.json` deployed with the app;
  it rewrites all paths to `index.html`.
- **Recurring transactions not appearing** — they're generated lazily (on load of the Recurring
  page or Dashboard) and hourly via the built-in job; check the rule's `startDate` isn't in the
  future and `isActive` is true.
- **Mongo connection timeout on Render** — double-check Network Access in Atlas allows
  `0.0.0.0/0`, and that the password in `MONGO_URI` doesn't contain unescaped special characters.

## Production Notes

- Rate limiting is enabled on auth endpoints (30 requests/15 min) and globally (500/15 min per IP).
- Passwords are bcrypt-hashed (cost factor 10); JWTs expire per `JWT_EXPIRE`.
- MongoDB injection protection via `express-mongo-sanitize`; security headers via `helmet`.
- Demo/seed data never runs when `NODE_ENV=production`.
- The recurring-transaction generator is idempotent per period (guarded by `lastGeneratedDate`),
  so it's safe to call repeatedly or after downtime — it catches up without duplicating.
