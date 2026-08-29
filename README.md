# 🎬 KeReview

**KeReview** is a full‑stack movie review platform built strictly around **Kenyan cinema** —
discover released and upcoming Kenyan movies, rate and review them, build a watchlist, and keep
a personal tracker of the movies, TV series and books you're currently watching or reading. It
also includes an **AI Discovery** tool (admin‑only) that uses Claude with live web search to find
real Kenyan movies from news sites, YouTube and blogs, so the catalog can keep growing.

Designed with a **claymorphic + glassmorphic** UI in a palette inspired by the Kenyan flag
(black, red, green, gold).

---

## ✨ Features

- **Auth** — sign up / log in with email + password (JWT, bcrypt‑hashed passwords)
- **Kenyan movie catalog** — search, filter by genre/status, sort — seeded with 17 real Kenyan
  films (Nairobi Half Life, Supa Modo, Rafiki, Kati Kati, Watu Wote, 40 Sticks, and more)
- **Reviews & ratings** — 1–5 star ratings with written reviews, one review per user per movie
  (editable), average rating shown per movie
- **Watchlist** — save movies you plan to watch
- **My List** — a personal tracker for movies, TV series *and* books you're currently
  watching/reading, with status (in progress / completed / on hold / dropped) and progress notes
- **AI Discover** (admin) — pulls candidate Kenyan movies (released or upcoming) from the live
  web via the Anthropic API + web search tool, for you to review and import into the catalog
- **Claymorphic + glassmorphic UI** — soft embossed "clay" buttons/cards mixed with frosted
  glass panels, fully responsive

---

## 🗂 Project structure

```
kereview/
├── backend/          Node.js + Express API, SQLite database (better-sqlite3)
│   ├── src/
│   │   ├── db/        schema + seed data
│   │   ├── middleware/ auth (JWT)
│   │   ├── routes/     auth, movies, reviews, watchlist, my-list, ai
│   │   └── server.js
│   └── .env.example
└── frontend/         React 18 + Vite SPA
    └── src/
        ├── components/
        ├── context/    auth context
        ├── pages/
        └── styles/     theme.css (claymorphic + glassmorphic)
```

---

## 🚀 Getting started (local development)

You need **Node.js 18+** installed. No external database server is required — it uses a local
SQLite file that's created automatically.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set a real `JWT_SECRET` (any long random string). Everything else has sensible
defaults for local development.

Seed the database with the Kenyan movie catalog and a demo admin account:

```bash
npm run seed
```

This creates a demo admin login: **admin@kereview.co.ke / ChangeMe123!** — change or delete this
before deploying anywhere public.

Start the API server:

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Check it's alive: `curl http://localhost:5000/api/health`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and automatically proxies `/api/*` requests to the
backend on port 5000 (see `vite.config.js`).

Open `http://localhost:5173` in your browser, sign up for an account, and start browsing.

### 3. (Optional) Enable AI Discovery

The "AI Discover" page (visible to admin accounts only) lets you pull new/upcoming Kenyan movies
from the web using Claude's web search tool.

1. Get an API key from https://console.anthropic.com/
2. In `backend/.env`, set:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-4-6
   ```
3. Restart the backend (`npm run dev`).
4. Log in as an admin (e.g. the seeded demo admin account) and open **AI Discover** from the
   navbar. Enter a topic (e.g. "upcoming Kenyan movies 2026"), run discovery, review the
   AI‑found candidates and their sources, then import the ones you trust.

This feature is entirely optional — the rest of the app works fully without an API key.

---

## 🔐 Making a user an admin

Only admins can add/edit/delete catalog movies and use AI Discover. To promote a user, run this
against the SQLite database (or use the seeded demo admin account):

```bash
cd backend
node -e "
require('dotenv').config();
const db = require('./src/db');
db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run('you@example.com');
console.log('done');
"
```

---

## 📦 Deploying

- **Backend**: deploy as a normal Node.js app (Render, Railway, Fly.io, a VPS, etc.). Make sure
  the `data/` directory (or wherever `DB_PATH` points) is on persistent storage, and set real
  environment variables (`JWT_SECRET`, `CLIENT_URL`, and optionally `ANTHROPIC_API_KEY`).
- **Frontend**: `npm run build` produces a static `dist/` folder you can deploy to Vercel,
  Netlify, GitHub Pages, or any static host. Update the API URL (currently proxied via Vite in
  dev) to point at your deployed backend, e.g. by setting a `VITE_API_URL` env var and updating
  `frontend/src/api.js`'s `BASE_URL` accordingly, or by serving both from the same domain behind
  a reverse proxy.

---

## ⬆️ Pushing to GitHub

```bash
cd kereview
git init
git add .
git commit -m "Initial commit: KeReview - Kenyan movie review platform"
git branch -M main
git remote add origin https://github.com/<your-username>/kereview.git
git push -u origin main
```

`.gitignore` files are already included in both `backend/` and `frontend/` so `node_modules`,
`.env`, and the local SQLite database are never committed.

---

## 🛠 Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18, React Router, Vite, plain CSS (claymorphic/glassmorphic theme) |
| Backend   | Node.js, Express |
| Database  | SQLite via `better-sqlite3` |
| Auth      | JWT + bcrypt |
| AI        | Anthropic API (Claude) with the web search tool, for Kenyan movie discovery |

---

## 📝 Notes

- The seeded catalog contains real Kenyan film titles with original, hand‑written synopses.
- Movie posters are optional — if a `posterUrl` isn't set, a themed placeholder is shown. You can
  add real poster URLs manually via the movies API or the AI Discover import flow.
- The "My List" tracker is intentionally generic (movies, TV, or books) since it's meant for
  *personal* tracking of anything you're currently consuming, separate from the Kenyan‑only
  public catalog.

Enjoy building on top of KeReview — *Habari ya sinema leo?* 🎬🇰🇪
