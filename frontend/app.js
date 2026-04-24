const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const log = document.getElementById("chat-log");

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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (!question) return;

  addMessage("user", question);
  input.value = "";

  try {
    const res = await fetch(window.CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    addMessage("bot", data.answer, data.citations || []);
  } catch (err) {
    addMessage("bot", "Sorry, the assistant is temporarily unavailable.");
    console.error(err);
  }
});
