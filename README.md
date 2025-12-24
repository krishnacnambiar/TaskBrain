# Task Brain

Task Brain is a small Fastify + TypeScript server with a SQLite store, a lightweight UI, and a Chrome/Edge extension for capturing tasks.

## Prerequisites
- Node.js 18+
- npm

## Server (Linux/macOS/WSL/Windows)
1. `cd server`
2. `npm install`
3. Set an auth token environment variable (use the same value in the extension/options UI):
   - Linux/macOS/WSL: `export TASKBRAIN_TOKEN=your-secret`
   - PowerShell: `$env:TASKBRAIN_TOKEN="your-secret"`
4. Development mode with hot reload: `npm run dev`
5. Production build: `npm run build`
6. Start after building: `npm run start`

The server listens on `http://0.0.0.0:8787` by default. SQLite data lives in `server/data/taskbrain.db`.

### API endpoints (all require the `x-taskbrain-token` header)
- `POST /ingest` – create a task captured from the browser extension
- `GET /tasks` – list tasks (newest first)
- `GET /tasks/:id` – fetch a single task
- `PATCH /tasks/:id` – edit task fields
- `GET /health` – health check

### Scoring and auto-status
- Deadline proximity: `<24h => 50`, `2–3d => 35`, `4–7d => 20`, `>7d => 10`, `no due date => 5`
- Criticality bonus: `P0=30, P1=20, P2=10, P3=3`
- Effort penalty: `S=+5, M=0, L=-5, XL=-10`
- Ingest auto-status: `>=80 today`, `60–79 next`, `40–59 backlog`, otherwise backlog; if `dueAt` is null **and** criticality is `P2` or `P3`, status becomes `inbox`.

### Web UI
- Served from `/` by the Fastify server (no external CDNs).
- Board columns for Today/Next/Backlog plus an Inbox tab.
- Filters by workstream and status.
- Click a card to edit fields and send a PATCH request.
- Provide the API token and base URL in the header bar to load data.

## Browser extension (Chrome/Edge, Manifest V3)
Files live in `extension/` and are ready to load as an unpacked extension.

Features:
- Popup auto-fills page title, URL, and selected text (via content script).
- Form fields: workstream, due date/time, criticality, effort, notes.
- Sends `POST /ingest` with `x-taskbrain-token` header.
- Options page stores base URL (default `http://192.168.1.10:8787`) and token in `chrome.storage.sync`.

### Install
1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder.
4. Open extension **Details → Extension options** to set the base URL and token.
5. Use the toolbar icon to open the popup and submit tasks.

## Project structure
- `server/` – Fastify + TypeScript server, SQLite database, UI assets
- `extension/` – Manifest V3 extension ready for Chrome/Edge

## Scripts
Run inside `server/`:
- `npm run dev` – start Fastify with hot reload
- `npm run build` – TypeScript build to `dist/`
- `npm run start` – run built server
