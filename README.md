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

Replace the empty array in [`docs/data/todos.json`](docs/data/todos.json):

```json
[
  {
    "title": "Ship EKOO draft",
    "lane": "wool",
    "bot": "wool_grants"
  },
  {
    "title": "RLS audit",
    "lane": "lt",
    "bot": "lt_supabase",
    "status": "open"
  }
]
```

Supported fields per item: `title` (or `text`), optional `lane`, `bot`, `status`.

An empty `[]` shows the waiting empty state:

> Waiting on @todo snapshot — panel fills on next update.

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
