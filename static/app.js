let startTime = null;
let timerInterval = null;
let currentEntryId = null;

let isPaused = false;
let elapsedTime = 0;

let lastActivity = null;
let lastCategory = null;
let lastPriority = "medium";

let allEntries = [];

/* ===== ELEMENTY ===== */
const timer = document.getElementById("timer");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const stopBtn = document.getElementById("stop");
const resetDayBtn = document.getElementById("resetDay");

/* ===== PRIORYTETY ===== */
const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };
const PRIORITY_LABEL = {
  high: "🔴 Wysoki",
  medium: "🟡 Średni",
  low: "🟢 Niski"
};

/* ===== FORMAT ===== */
function format(ms) {
  const t = Math.floor(ms / 1000);
  return (
    String(Math.floor(t / 3600)).padStart(2, "0") + ":" +
    String(Math.floor((t % 3600) / 60)).padStart(2, "0") + ":" +
    String(t % 60).padStart(2, "0")
  );
}
const formatSeconds = sec => format((sec || 0) * 1000);

/* ===== START ===== */
startBtn.onclick = async () => {
  const activity = document.getElementById("activity").value.trim();
  const category =
    document.getElementById("customCategory").value.trim() ||
    document.getElementById("category").value ||
    null;
  const priority = document.getElementById("priority").value;

  if (!activity) return alert("Podaj nazwę aktywności");

  lastActivity = activity;
  lastCategory = category;
  lastPriority = priority;

  const res = await fetch("/api/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activity, category, priority })
  });

  const data = await res.json();
  currentEntryId = data.id;

  elapsedTime = 0;
  startTime = Date.now();
  isPaused = false;

  timerInterval = setInterval(() => {
    timer.textContent = format(elapsedTime + (Date.now() - startTime));
  }, 1000);

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
};

/* ===== PAUZA / WZNÓW ===== */
pauseBtn.onclick = () => {
  if (!currentEntryId) return;

  if (!isPaused) {
    clearInterval(timerInterval);
    elapsedTime += Date.now() - startTime;
    isPaused = true;
    pauseBtn.textContent = "Wznów";
  } else {
    startTime = Date.now();
    timerInterval = setInterval(() => {
      timer.textContent = format(elapsedTime + (Date.now() - startTime));
    }, 1000);
    isPaused = false;
    pauseBtn.textContent = "Pauza";
  }
};

/* ===== STOP ===== */
stopBtn.onclick = async () => {
  if (!currentEntryId) return;

  clearInterval(timerInterval);
  elapsedTime += Date.now() - startTime;

  await fetch(`/api/stop/${currentEntryId}`, { method: "POST" });

  timer.textContent = "00:00:00";
  currentEntryId = null;
  elapsedTime = 0;
  isPaused = false;

  startBtn.disabled = false;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  pauseBtn.textContent = "Pauza";

  loadHistory();
  loadSummary();
};

/* ===== HISTORIA – GRUPOWANIE ===== */
async function loadHistory() {
  const res = await fetch("/api/entries");
  allEntries = await res.json();
  renderHistory();
  renderCategorySummary(); // ⬅️ DODANE
}


function renderHistory() {
  const grouped = {};

  allEntries.forEach(e => {
    const key = `${e.activity}__${e.category || ""}__${e.priority}`;

    if (!grouped[key]) {
      grouped[key] = {
        activity: e.activity,
        category: e.category,
        priority: e.priority,
        totalSeconds: 0,
        ids: [],
        is_favorite: e.is_favorite,
        status: e.status
      };
    }

    grouped[key].totalSeconds += e.duration_seconds || 0;
    grouped[key].ids.push(e.id);
  });

  const items = Object.values(grouped).sort((a, b) => {
    if (b.is_favorite !== a.is_favorite) return b.is_favorite - a.is_favorite;
    return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
  });

  const list = document.getElementById("history");
  list.innerHTML = "";

  items.forEach(item => {
    const firstId = item.ids[0];
    const isRunning = item.status === "in_progress";

    list.innerHTML += `
      <li>
        <button onclick="toggleFavorite(${firstId})">
          ${item.is_favorite ? "⭐" : "☆"}
        </button>

        <strong>${item.activity}</strong>
        ${item.category ? `(${item.category})` : ""}
        ${PRIORITY_LABEL[item.priority]}
        – ${formatSeconds(item.totalSeconds)}

        <button onclick="toggleStatus(${firstId})">
          ${isRunning ? "⏳ W trakcie" : "✔ Zakończone"}
        </button>

        <button onclick='editGroup(${JSON.stringify(item)})'>✏️</button>
        <button onclick='deleteGroup(${JSON.stringify(item.ids)})'>🗑</button>
      </li>
    `;
  });
}

function renderCategorySummary() {
  const summary = {};

  allEntries.forEach(e => {
    const category = e.category || "Bez kategorii";
    summary[category] = (summary[category] || 0) + (e.duration_seconds || 0);
  });

  const list = document.getElementById("categorySummary");
  list.innerHTML = "";

  Object.entries(summary).forEach(([category, seconds]) => {
    list.innerHTML += `
      <li>
        <strong>${category}</strong> – ${formatSeconds(seconds)}
      </li>
    `;
  });
}


/* ===== ULUBIONE ===== */
async function toggleFavorite(id) {
  await fetch(`/api/entries/${id}/toggle-favorite`, { method: "POST" });
  loadHistory();
}

/* ===== STATUS ===== */
async function toggleStatus(id) {
  await fetch(`/api/entries/${id}/toggle-status`, { method: "POST" });
  loadHistory();
}

/* ===== EDYCJA ===== */
async function editGroup(item) {
  const name = prompt("Nowa nazwa:", item.activity);
  if (!name) return;

  const category = prompt("Nowa kategoria:", item.category || "");
  const time = prompt("Nowy czas (HH:MM:SS):", formatSeconds(item.totalSeconds));
  const [h, m, s] = time.split(":").map(Number);
  const seconds = h * 3600 + m * 60 + s;

  const [first, ...rest] = item.ids;

  await fetch(`/api/entries/${first}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      activity: name,
      category,
      manual_duration_seconds: seconds
    })
  });

  for (const id of rest) {
    await fetch(`/api/entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity: name,
        category,
        manual_duration_seconds: 0
      })
    });
  }

  loadHistory();
  loadSummary();
}

/* ===== DELETE ===== */
async function deleteGroup(ids) {
  if (!confirm("Usunąć aktywność?")) return;
  for (const id of ids) {
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
  }
  loadHistory();
  loadSummary();
}

/* ===== SUMMARY ===== */
async function loadSummary() {
  const res = await fetch("/api/summary");
  const data = await res.json();
  document.getElementById("summary").textContent =
    "Łączny czas: " + formatSeconds(data.total_seconds);
}

/* ===== RESET ===== */
resetDayBtn.onclick = async () => {
  if (!confirm("Zresetować dzień?")) return;
  for (const e of allEntries) {
    await fetch(`/api/entries/${e.id}`, { method: "DELETE" });
  }
  loadHistory();
  loadSummary();
};

/* ===== INIT ===== */
loadHistory();
loadSummary();
