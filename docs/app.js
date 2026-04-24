const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const log = document.getElementById("chat-log");
const apiInput = document.getElementById("api-url-input");
const saveApiBtn = document.getElementById("save-api-url");

const API_KEY = "portfolio_chat_api_url";

function getApiUrl() {
  const stored = localStorage.getItem(API_KEY);
  return stored || window.CHAT_API_URL || "";
}

function setApiUrl(url) {
  localStorage.setItem(API_KEY, url);
}

function addMessage(role, text, citations = []) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;

  const body = document.createElement("div");
  body.textContent = text;
  div.appendChild(body);

  if (citations.length) {
    const meta = document.createElement("small");
    meta.className = "meta";
    meta.textContent = `Sources: ${citations.join(" | ")}`;
    div.appendChild(meta);
  }

  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function showStartupMessage() {
  const apiUrl = getApiUrl();
  if (apiUrl) {
    addMessage("bot", `Assistant ready. Connected endpoint: ${apiUrl}`);
  } else {
    addMessage(
      "bot",
      "Please set your Worker API URL in 'API connection settings' before using chat.",
    );
  }
}

saveApiBtn.addEventListener("click", () => {
  const value = apiInput.value.trim();
  if (!value) return;
  setApiUrl(value);
  addMessage("bot", "API URL saved. You can now chat with the assistant.");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (!question) return;

  addMessage("user", question);
  input.value = "";

  const apiUrl = getApiUrl();
  if (!apiUrl) {
    addMessage("bot", "Missing API URL. Open 'API connection settings' and save your Worker endpoint.");
    return;
  }

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const detail = data?.detail || data?.error || `HTTP ${res.status}`;
      throw new Error(detail);
    }

    addMessage("bot", data.answer || "No answer returned.", data.citations || []);
  } catch (err) {
    addMessage("bot", `Assistant error: ${err.message}`);
    console.error(err);
  }
});

apiInput.value = getApiUrl();
showStartupMessage();
