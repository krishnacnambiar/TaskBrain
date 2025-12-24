async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function loadSelection(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "GET_SELECTION" });
    return response?.selection || "";
  } catch (err) {
    console.warn("Selection unavailable", err);
    return "";
  }
}

async function loadSettings() {
  const { baseUrl, token } = await chrome.storage.sync.get({ baseUrl: "http://192.168.1.10:8787", token: "" });
  return { baseUrl, token };
}

async function populateDefaults() {
  const tab = await getActiveTab();
  document.getElementById("title").value = tab?.title || "";
  document.getElementById("url").value = tab?.url || "";
  document.getElementById("selection").value = await loadSelection(tab.id);
}

async function submitTask(event) {
  event.preventDefault();
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Sending...";
  const { baseUrl, token } = await loadSettings();
  if (!token) {
    statusEl.textContent = "Add a token in Options first.";
    return;
  }

  const payload = {
    title: document.getElementById("title").value,
    url: document.getElementById("url").value,
    selection: document.getElementById("selection").value || null,
    notes: document.getElementById("notes").value || null,
    workstream: document.getElementById("workstream").value,
    criticality: document.getElementById("criticality").value,
    effort: document.getElementById("effort").value,
    dueAt: document.getElementById("dueAt").value
      ? new Date(document.getElementById("dueAt").value).toISOString()
      : null,
  };

  try {
    const res = await fetch(`${baseUrl}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-taskbrain-token": token,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text}`);
    }
    statusEl.textContent = "Task sent!";
  } catch (err) {
    statusEl.textContent = `Failed: ${err.message}`;
  }
}

document.getElementById("taskForm").addEventListener("submit", submitTask);

document.addEventListener("DOMContentLoaded", populateDefaults);
