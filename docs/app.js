const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const log = document.getElementById("chat-log");
const sendBtn = document.getElementById("send-btn");

let isSending = false;

function addMessage(role, text, citations = []) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;

  const body = document.createElement("div");
  body.textContent = text;
  div.appendChild(body);

  if (citations.length) {
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `Sources: ${citations.join(" | ")}`;
    div.appendChild(meta);
  }

  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function addTyping() {
  const typing = document.createElement("div");
  typing.className = "msg bot";
  typing.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
  log.appendChild(typing);
  log.scrollTop = log.scrollHeight;
  return typing;
}

function setSendingState(sending) {
  isSending = sending;
  input.disabled = sending;

  if (sendBtn) {
    sendBtn.disabled = sending;
    sendBtn.textContent = sending ? "Sending..." : "Send";
  }
}

addMessage(
  "bot",
  "Hi! I can answer questions about Ahmed’s research, education, experience, publications, and CV.",
);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSending) return;

  const question = input.value.trim();
  if (!question) return;

  addMessage("user", question);
  input.value = "";
  setSendingState(true);

  const apiUrl = window.CHAT_API_URL;
  if (!apiUrl) {
    addMessage("bot", "Chat endpoint is not configured yet.");
    setSendingState(false);
    return;
  }

  const typing = addTyping();

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json().catch(() => ({}));
    typing.remove();

    if (!res.ok) {
      throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
    }

    addMessage("bot", data.answer || "No answer returned.", data.citations || []);
  } catch (err) {
    typing.remove();
    addMessage("bot", "Sorry, I could not reach the AI assistant right now. Please try again in a moment.");
    console.error(err);
  } finally {
    setSendingState(false);
    input.focus();
  }
});
