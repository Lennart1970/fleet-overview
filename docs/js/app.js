/**
 * Fleet overview — renders lanes/bots/rooms from fleet.json
 * and open todos from todos.json.
 *
 * todos.json shapes:
 *   []                          → empty waiting state
 *   [ { title, ... }, ... ]     → flat list (legacy)
 *   { snapshot, todos: [...] }  → grouped board
 *
 * Todo fields: id, title|text, due, lane, bot, priority, status, group
 * Groups: overdue | due_soon | later | undated (auto from due if omitted)
 */

const UPDATED =
  typeof window.__FLEET_UPDATED__ === "string" && window.__FLEET_UPDATED__
    ? window.__FLEET_UPDATED__
    : document.lastModified;

const GROUP_ORDER = ["overdue", "due_soon", "later", "undated"];
const GROUP_LABELS = {
  overdue: "Overdue",
  due_soon: "Due soon",
  later: "Later",
  undated: "Undated",
};

const LANE_ACCENTS = {
  wool: "#5ec8a8",
  lt: "#6b9fd4",
  acfo: "#c9a06a",
  personal: "#d4a06b",
  assets: "#8fa3b8",
  life: "#d4849a",
  meta: "#9b8fd4",
};

function formatUpdated(isoOrDate) {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

function formatDue(due) {
  if (!due) return null;
  const d = new Date(`${due}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(due);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

function setLastUpdated() {
  const el = document.getElementById("last-updated");
  if (!el) return;
  const parsed = new Date(UPDATED);
  el.dateTime = Number.isNaN(parsed.getTime())
    ? String(UPDATED)
    : parsed.toISOString();
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

function normalizeTodosPayload(payload) {
  if (Array.isArray(payload)) {
    return { snapshot: null, todos: payload };
  }
  if (payload && typeof payload === "object") {
    return {
      snapshot: payload.snapshot ?? null,
      timezone: payload.timezone ?? null,
      todos: Array.isArray(payload.todos) ? payload.todos : [],
    };
  }
  return { snapshot: null, todos: [] };
}

function resolveGroup(item, todayIso) {
  if (item.group && GROUP_ORDER.includes(item.group)) return item.group;
  if (!item.due) return "undated";
  if (item.due < todayIso) return "overdue";
  // due soon: today + next 3 days
  const soon = new Date(`${todayIso}T12:00:00`);
  soon.setDate(soon.getDate() + 3);
  const soonIso = soon.toISOString().slice(0, 10);
  if (item.due <= soonIso) return "due_soon";
  return "later";
}

function todayInAmsterdam() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function todoItem(item) {
  const li = document.createElement("li");
  li.className = "todo-item";
  if (item.priority === "high") li.classList.add("is-high");

  const mark = document.createElement("span");
  mark.className = "todo-mark";
  mark.setAttribute("aria-hidden", "true");

  const body = document.createElement("div");
  body.className = "todo-body";

  const top = document.createElement("div");
  top.className = "todo-top";

  if (item.id) {
    const id = document.createElement("span");
    id.className = "todo-id";
    id.textContent = item.id;
    top.append(id);
  }

  const title = document.createElement("p");
  title.className = "todo-title";
  title.textContent = item.title ?? item.text ?? String(item);
  top.append(title);

  if (item.priority === "high") {
    const pri = document.createElement("span");
    pri.className = "todo-priority";
    pri.textContent = "high";
    top.append(pri);
  }

  body.append(top);

  const meta = document.createElement("div");
  meta.className = "todo-meta";

  if (item.lane) {
    const lane = document.createElement("span");
    lane.className = "todo-lane";
    lane.textContent = item.lane;
    const accent = LANE_ACCENTS[item.lane];
    if (accent) lane.style.setProperty("--lane-accent", accent);
    meta.append(lane);
  }

  const dueLabel = formatDue(item.due);
  if (dueLabel) {
    const due = document.createElement("span");
    due.className = "todo-due";
    due.textContent = `due ${dueLabel}`;
    meta.append(due);
  }

  if (item.bot) {
    const bot = document.createElement("span");
    bot.className = "todo-bot";
    bot.textContent = item.bot;
    meta.append(bot);
  }

  if (meta.childNodes.length) body.append(meta);

  li.append(mark, body);
  return li;
}

function renderTodos(payload) {
  const root = document.getElementById("todos");
  const snapLabel = document.getElementById("todos-snapshot-label");
  if (!root) return;

  const { snapshot, todos } = normalizeTodosPayload(payload);

  if (snapLabel) {
    snapLabel.textContent = snapshot
      ? `snapshot ${snapshot} · Europe/Amsterdam`
      : "waiting on @todo snapshot";
  }

  if (!todos.length) {
    root.innerHTML = `
      <p class="todos-empty">
        Waiting on @todo snapshot — panel fills on next update.
      </p>
    `;
    root.classList.add("is-empty");
    return;
  }

  root.classList.remove("is-empty");
  const today = todayInAmsterdam();
  const buckets = Object.fromEntries(GROUP_ORDER.map((g) => [g, []]));

  for (const item of todos) {
    const g = resolveGroup(item, today);
    buckets[g].push(item);
  }

  const wrap = document.createElement("div");
  wrap.className = "todo-groups";

  for (const group of GROUP_ORDER) {
    const items = buckets[group];
    if (!items.length) continue;

    const section = document.createElement("section");
    section.className = `todo-group todo-group--${group}`;
    section.setAttribute("aria-label", GROUP_LABELS[group]);

    const head = document.createElement("div");
    head.className = "todo-group-head";

    const h = document.createElement("h3");
    h.className = "todo-group-title";
    h.textContent = GROUP_LABELS[group];

    const count = document.createElement("span");
    count.className = "todo-group-count";
    count.textContent = String(items.length);

    head.append(h, count);

    const list = document.createElement("ul");
    list.className = "todo-list";
    for (const item of items) list.append(todoItem(item));

    section.append(head, list);
    wrap.append(section);
  }

  root.replaceChildren(wrap);
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
