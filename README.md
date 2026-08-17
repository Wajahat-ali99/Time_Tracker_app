# Ledger — Time Tracker (web)

A browser-based time tracking app (React + Vite). Deployable to Vercel or
Render as a static site.

## Features

- Dashboard with today's hours and billable total
- Add time entry — customer, project, task, work type, description,
  start/end time with auto-calculated hours, billable checkbox
- Timer — Start / Pause / Stop, creates an entry automatically on stop
- Reports — daily, weekly, monthly, hours by project, Export to CSV
- Search across all entries
- Customer / project master lists
- Multiple users (switch from the sidebar)
- Reminder banner if nothing's logged today

## Where data lives

This is a static, client-only app — there's no server and no database.
All data is saved to **your browser's local storage**, scoped to the
device and browser you're using. It persists across page reloads and
browser restarts, but:

- It won't sync between devices or browsers
- Clearing browser data / site data will erase it
- Each visitor to the deployed site has their own separate data — nothing
  is shared between users

If you later want shared, cross-device data, that needs a small backend
(e.g. a Node API on Render backed by a database or a JSON file) — happy
to build that if you need it.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Deploy to Vercel

1. Push this folder to a GitHub repo (or run `vercel` from inside it with
   the [Vercel CLI](https://vercel.com/docs/cli) installed).
2. In the [Vercel dashboard](https://vercel.com/new), import the repo.
3. Vercel auto-detects Vite. Settings should be:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Deploy. You'll get a `*.vercel.app` URL.

Via CLI instead:

```bash
npm install -g vercel
vercel
```

## Deploy to Render

1. Push this folder to a GitHub repo.
2. In the [Render dashboard](https://dashboard.render.com), click
   **New → Static Site**.
3. Connect the repo and set:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Deploy. You'll get a `*.onrender.com` URL.

## Project structure

```
time-tracker-web/
  index.html
  vite.config.js
  package.json
  src/
    main.jsx     React entry point
    App.jsx      All app logic, views, and localStorage persistence
```
