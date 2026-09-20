# fleet-overview

Calm static **Fleet overview** for Lennart’s Grok Bot fleet (OpenClaw-style: lanes · bots · todos).

Live site is meant to be served from GitHub Pages.

## Enable GitHub Pages

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**
3. Branch: **`main`**
4. Folder: **`/docs`**
5. Save — the site will publish at  
   `https://<user>.github.io/fleet-overview/`  
   (or your custom domain)

No build step is required: `docs/index.html` is the entry point.

## Local preview

From the repo root:

```bash
# any static server from docs/
python3 -m http.server 8080 --directory docs
```

Then open http://localhost:8080

> Note: the todos panel loads `data/todos.json` via `fetch`. Opening `index.html` as a `file://` URL may block that; use a local server.

## Update open todos

Edit [`docs/data/todos.json`](docs/data/todos.json). Preferred shape:

```json
{
  "snapshot": "2026-09-20",
  "timezone": "Europe/Amsterdam",
  "todos": [
    {
      "id": "F-65",
      "title": "Cancel Meta",
      "due": "2026-09-20",
      "lane": "personal",
      "priority": "high",
      "group": "due_soon"
    }
  ]
}
```

Fields: `id`, `title` (or `text`), optional `due` (YYYY-MM-DD), `lane`, `bot`, `priority` (`high`), `group` (`overdue` | `due_soon` | `later` | `undated`).

A bare `[]` (or `{ "todos": [] }`) shows the waiting empty state.

Lane tags used on the board: `wool`, `lt`, `acfo`, `personal`, `assets`.

## Fleet data

Lanes, bots, and example rooms live in [`docs/data/fleet.json`](docs/data/fleet.json). Edit that file and commit to update the dashboard.

The **Last updated** stamp is set in `docs/index.html` as `window.__FLEET_UPDATED__` (ISO UTC). Bump it when you publish a snapshot.

## Structure

```
docs/
  index.html
  css/styles.css
  js/app.js
  data/
    fleet.json
    todos.json
```
