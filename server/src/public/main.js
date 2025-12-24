const tokenInput = document.getElementById("tokenInput");
const baseUrlInput = document.getElementById("baseUrlInput");
const savePrefsBtn = document.getElementById("savePrefs");
const refreshBtn = document.getElementById("refreshBtn");
const boardView = document.getElementById("boardView");
const inboxView = document.getElementById("inboxView");
const workstreamFilter = document.getElementById("workstreamFilter");
const statusFilter = document.getElementById("statusFilter");
const tabs = document.querySelectorAll(".tab");
const dialog = document.getElementById("taskDialog");
const closeDialogBtn = document.getElementById("closeDialog");
const taskForm = document.getElementById("taskForm");
const dialogTitle = document.getElementById("dialogTitle");

let tasks = [];

function loadPrefs() {
  const token = localStorage.getItem("taskbrainToken") || "";
  const baseUrl = localStorage.getItem("taskbrainBaseUrl") || `${window.location.origin}`;
  tokenInput.value = token;
  baseUrlInput.value = baseUrl;
}

function savePrefs() {
  localStorage.setItem("taskbrainToken", tokenInput.value.trim());
  localStorage.setItem("taskbrainBaseUrl", baseUrlInput.value.trim());
}

async function fetchTasks() {
  const baseUrl = baseUrlInput.value.trim();
  const token = tokenInput.value.trim();
  if (!token) {
    alert("Add your API token to load tasks.");
    return;
  }
  const res = await fetch(`${baseUrl}/tasks`, {
    headers: {
      "Content-Type": "application/json",
      "x-taskbrain-token": token,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    alert(`Failed to load tasks: ${res.status} ${text}`);
    return;
  }
  tasks = await res.json();
  render();
}

function render() {
  const workstream = workstreamFilter.value;
  const status = statusFilter.value;
  const filtered = tasks.filter((task) => {
    const matchesWs = workstream === "all" || task.workstream === workstream;
    const matchesStatus = status === "all" || task.status === status;
    return matchesWs && matchesStatus;
  });
  renderBoard(filtered);
  renderInbox(filtered);
}

function groupByStatus(list) {
  return list.reduce(
    (acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    },
    {}
  );
}

function renderBoard(list) {
  const statuses = [
    { key: "today", label: "Today" },
    { key: "next", label: "Next" },
    { key: "backlog", label: "Backlog" },
  ];
  const grouped = groupByStatus(list);
  boardView.innerHTML = "";
  statuses.forEach((col) => {
    const column = document.createElement("div");
    column.className = "column";
    column.innerHTML = `<h2>${col.label}</h2>`;
    const container = document.createElement("div");
    container.className = "tasks";
    (grouped[col.key] || []).forEach((task) => container.appendChild(renderTaskCard(task)));
    column.appendChild(container);
    boardView.appendChild(column);
  });
}

function renderInbox(list) {
  const inboxTasks = list.filter((t) => t.status === "inbox");
  inboxView.innerHTML = "";
  inboxTasks.forEach((task) => inboxView.appendChild(renderTaskCard(task)));
}

function renderTaskCard(task) {
  const div = document.createElement("div");
  div.className = "task";
  div.innerHTML = `
    <div class="title">${task.title}</div>
    <div class="meta">
      <span class="pill">${task.workstream}</span>
      <span class="pill">${task.criticality}</span>
      <span class="pill">Effort ${task.effort}</span>
      <span class="status-pill">${task.status}</span>
      <span>Score: ${task.score}</span>
      ${task.dueAt ? `<span>Due: ${formatDate(task.dueAt)}</span>` : ""}
    </div>
  `;
  div.addEventListener("click", () => openDialog(task));
  return div;
}

function openDialog(task) {
  dialogTitle.textContent = task.title;
  taskForm.title.value = task.title;
  taskForm.url.value = task.url;
  taskForm.status.value = task.status;
  taskForm.workstream.value = task.workstream;
  taskForm.criticality.value = task.criticality;
  taskForm.effort.value = task.effort;
  taskForm.dueAt.value = task.dueAt ? toLocalInput(task.dueAt) : "";
  taskForm.notes.value = task.notes || "";
  taskForm.id.value = task.id;
  dialog.showModal();
}

function toLocalInput(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function formatDate(value) {
  const d = new Date(value);
  return d.toLocaleString();
}

async function saveTask(event) {
  event.preventDefault();
  const token = tokenInput.value.trim();
  const baseUrl = baseUrlInput.value.trim();
  const id = taskForm.id.value;
  const payload = {
    title: taskForm.title.value,
    url: taskForm.url.value,
    status: taskForm.status.value,
    workstream: taskForm.workstream.value,
    criticality: taskForm.criticality.value,
    effort: taskForm.effort.value,
    dueAt: taskForm.dueAt.value ? new Date(taskForm.dueAt.value).toISOString() : null,
    notes: taskForm.notes.value || null,
  };

  const res = await fetch(`${baseUrl}/tasks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-taskbrain-token": token,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    alert(`Failed to update: ${res.status} ${text}`);
    return;
  }
  dialog.close();
  await fetchTasks();
}

function switchTab(target) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === target));
  const isBoard = target === "board";
  boardView.style.display = isBoard ? "grid" : "none";
  inboxView.style.display = isBoard ? "none" : "block";
}

function bindEvents() {
  savePrefsBtn.addEventListener("click", () => {
    savePrefs();
    fetchTasks();
  });
  refreshBtn.addEventListener("click", fetchTasks);
  workstreamFilter.addEventListener("change", render);
  statusFilter.addEventListener("change", render);
  closeDialogBtn.addEventListener("click", () => dialog.close());
  taskForm.addEventListener("submit", saveTask);
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => switchTab(tab.dataset.tab))
  );
}

(async function init() {
  loadPrefs();
  bindEvents();
  await fetchTasks();
})();
