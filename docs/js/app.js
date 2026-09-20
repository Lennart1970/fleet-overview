/**
 * Fleet overview — renders lanes/bots/rooms from fleet.json
 * and open todos from todos.json (empty [] = waiting empty state).
 *
 * To fill todos later, replace docs/data/todos.json with e.g.:
 * [
 *   { "title": "Ship EKOO draft", "lane": "wool", "bot": "wool_grants" },
 *   { "title": "RLS audit", "lane": "lt", "bot": "lt_supabase" }
 * ]
 */

const UPDATED =
  typeof window.__FLEET_UPDATED__ === "string" && window.__FLEET_UPDATED__
    ? window.__FLEET_UPDATED__
    : document.lastModified;

function formatUpdated(isoOrDate) {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

function setLastUpdated() {
  const el = document.getElementById("last-updated");
  if (!el) return;
  el.dateTime = new Date(UPDATED).toISOString();
  el.textContent = formatUpdated(UPDATED);
}

function botChip(bot, accent) {
  const li = document.createElement("li");
  li.className = "bot-chip";
  li.style.setProperty("--lane-accent", accent);
  li.innerHTML = `
    <span class="bot-name"></span>
    <span class="bot-job"></span>
  `;
  li.querySelector(".bot-name").textContent = bot.name;
  li.querySelector(".bot-job").textContent = bot.job;
  return li;
}

function renderLanes(lanes) {
  const root = document.getElementById("lanes");
  if (!root) return;
  root.replaceChildren();

  for (const lane of lanes) {
    const card = document.createElement("article");
    card.className = "lane-card";
    card.dataset.lane = lane.id;
    card.style.setProperty("--lane-accent", lane.accent);

    const head = document.createElement("div");
    head.className = "lane-card-head";

    const name = document.createElement("h3");
    name.className = "lane-name";
    name.textContent = lane.name;

    const count = document.createElement("span");
    count.className = "lane-count";
    const n = lane.bots?.length ?? 0;
    count.textContent = `${n} bot${n === 1 ? "" : "s"}`;

    head.append(name, count);

    const list = document.createElement("ul");
    list.className = "bot-list";
    for (const bot of lane.bots ?? []) {
      list.append(botChip(bot, lane.accent));
    }

    card.append(head, list);
    root.append(card);
  }
}

function renderRooms(rooms) {
  const root = document.getElementById("rooms");
  if (!root) return;
  root.replaceChildren();

  for (const room of rooms) {
    const li = document.createElement("li");
    li.className = "room-chip";
    li.textContent = room;
    root.append(li);
  }
}

function renderTodos(todos) {
  const root = document.getElementById("todos");
  if (!root) return;

  if (!Array.isArray(todos) || todos.length === 0) {
    root.innerHTML = `
      <p class="todos-empty">
        Waiting on @todo snapshot — panel fills on next update.
      </p>
    `;
    return;
  }

  const list = document.createElement("ul");
  list.className = "todo-list";

  for (const item of todos) {
    const li = document.createElement("li");
    li.className = "todo-item";

    const mark = document.createElement("span");
    mark.className = "todo-mark";
    mark.setAttribute("aria-hidden", "true");

    const body = document.createElement("div");
    const title = document.createElement("p");
    title.className = "todo-title";
    title.textContent = item.title ?? item.text ?? String(item);

    const metaBits = [item.lane, item.bot, item.status].filter(Boolean);
    if (metaBits.length) {
      const meta = document.createElement("p");
      meta.className = "todo-meta";
      meta.textContent = metaBits.join(" · ");
      body.append(title, meta);
    } else {
      body.append(title);
    }

    li.append(mark, body);
    list.append(li);
  }

  root.replaceChildren(list);
}

async function loadJson(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function init() {
  setLastUpdated();

  try {
    const [fleet, todos] = await Promise.all([
      loadJson("data/fleet.json"),
      loadJson("data/todos.json"),
    ]);
    renderLanes(fleet.lanes ?? []);
    renderRooms(fleet.rooms ?? []);
    renderTodos(todos);
  } catch (err) {
    console.error(err);
    const lanes = document.getElementById("lanes");
    if (lanes && !lanes.children.length) {
      lanes.innerHTML = `<p class="todos-empty">Could not load fleet data.</p>`;
    }
  }
}

init();
