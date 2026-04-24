import kb from "../../data/kb.json";

function withCors(response, origin = "*") {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function retrieveTopChunks(question, chunks, k = 5) {
  const qTokens = new Set(tokenize(question));
  const scored = chunks.map((chunk) => {
    const cTokens = tokenize(chunk.text);
    const overlap = cTokens.reduce((acc, t) => acc + (qTokens.has(t) ? 1 : 0), 0);
    const score = overlap / Math.max(cTokens.length, 1);
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

function formatCitations(chunks) {
  return chunks.map((c) => `${c.source} > ${c.section}`);
}

async function callLlm({ apiKey, model, question, contexts }) {
  const systemPrompt = [
    "You are a portfolio assistant.",
    "Answer ONLY using the provided CONTEXT.",
    "If information is missing, say: 'That information is not available in the provided data.'",
    "Do not fabricate names, dates, affiliations, or achievements.",
    "When possible, use short bullet points.",
    "Be concise and factual.",
  ].join(" ");

  const userPrompt = `QUESTION:\n${question}\n\nCONTEXT:\n${contexts
    .map((c, i) => `[${i + 1}] ${c.text} (source: ${c.source}, section: ${c.section})`)
    .join("\n\n")}`;

  const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`LLM request failed: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "No response from model.";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), allowedOrigin);
    }

    if (!["/api/chat", "/chat"].includes(url.pathname)) {
      return withCors(new Response("Not found", { status: 404 }), allowedOrigin);
    }

    if (request.method !== "POST") {
      return withCors(new Response("Method not allowed", { status: 405 }), allowedOrigin);
    }

    if (!env.MISTRAL_API_KEY) {
      return withCors(
        Response.json({ error: "MISTRAL_API_KEY is not configured" }, { status: 500 }),
        allowedOrigin,
      );
    }

    try {
      const { question } = await request.json();
      if (!question || typeof question !== "string") {
        return withCors(
          Response.json({ error: "question is required" }, { status: 400 }),
          allowedOrigin,
        );
      }

      const top = retrieveTopChunks(question, kb, 5);
      if (top.length === 0) {
        return withCors(
          Response.json({
            answer: "That information is not available in the provided data.",
            citations: [],
          }),
          allowedOrigin,
        );
      }

      const answer = await callLlm({
        apiKey: env.MISTRAL_API_KEY,
        model: env.MISTRAL_MODEL || "mistral-small-latest",
        question,
        contexts: top,
      });

      return withCors(
        Response.json({
          answer,
          citations: formatCitations(top),
        }),
        allowedOrigin,
      );
    } catch (err) {
      return withCors(
        Response.json(
          {
            error: "Internal error",
            detail: String(err?.message || err),
          },
          { status: 500 },
        ),
        allowedOrigin,
      );
    }
  },
};
