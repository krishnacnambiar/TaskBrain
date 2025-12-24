async function loadSettings() {
  const { baseUrl, token } = await chrome.storage.sync.get({ baseUrl: "http://192.168.1.10:8787", token: "" });
  document.getElementById("baseUrl").value = baseUrl;
  document.getElementById("token").value = token;
}

async function saveSettings() {
  const baseUrl = document.getElementById("baseUrl").value;
  const token = document.getElementById("token").value;
  await chrome.storage.sync.set({ baseUrl, token });
  document.getElementById("status").textContent = "Saved";
}

document.getElementById("save").addEventListener("click", saveSettings);

document.addEventListener("DOMContentLoaded", loadSettings);
