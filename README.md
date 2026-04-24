# Ahmed Abdelmaguid Portfolio + RAG Chatbot

This repository contains a personal academic portfolio website and a retrieval-based chatbot that answers questions only from trusted portfolio sources (CV + LinkedIn/Scholar exported/public data).

## Important security note

If an API key was ever pasted in chat/messages or committed anywhere, treat it as compromised and **rotate it immediately** in your Mistral account dashboard. Then store only the new key as a server-side secret (never in frontend files, never in git).

## Included data sources

- `data/raw/cv_ahmed_abdelmaguid.txt`
- `data/raw/linkedin_profile.txt`
- `data/raw/google_scholar_profile.txt`

These are compiled into `data/kb.json` for chatbot retrieval.

## Architecture

- **Frontend (GitHub Pages static)**: `frontend/`
- **Backend API (free serverless)**: Cloudflare Worker in `backend/cloudflare-worker/`
- **RAG knowledge base**: `data/kb.json` built from `data/raw/*`
- **LLM provider**: Mistral API (`mistral-small-latest` by default)

Flow:
1. Visitor asks question in website chat.
2. Frontend sends question to `/api/chat` on worker.
3. Worker retrieves best matching chunks from `data/kb.json`.
4. Worker calls Mistral using server-side API key.
5. Response is returned with citations.

## Why this is safe for GitHub Pages

- GitHub Pages is static and public.
- Mistral API key is never stored in frontend.
- LLM calls are made from serverless backend only.

## Run the KB build step

```bash
node scripts/build-kb.mjs
```

## You said you have no hosting

Use this zero-cost starter path:
- **Frontend**: GitHub Pages (free)
- **Backend**: Cloudflare Workers free tier

You only need:
- A GitHub account
- A Cloudflare account
- A Mistral API key

## Deploy backend (Cloudflare Worker)

1. Go to backend directory:
   ```bash
   cd backend/cloudflare-worker
   ```
2. Install Wrangler and login:
   ```bash
   npm i -g wrangler
   wrangler login
   ```
3. Set secrets (this is where key is hidden):
   ```bash
   wrangler secret put MISTRAL_API_KEY
   wrangler secret put ALLOWED_ORIGIN
   wrangler secret put MISTRAL_MODEL
   ```
   - For `MISTRAL_MODEL`, use `mistral-small-latest`.
   - Set `ALLOWED_ORIGIN` to your GitHub Pages URL (example: `https://ahmedhamdi101.github.io`).
4. Deploy:
   ```bash
   wrangler deploy
   ```
5. Copy deployed worker URL and put it in `frontend/index.html` as `window.CHAT_API_URL`.

## Deploy frontend on GitHub Pages

1. Push this repo to GitHub.
2. In GitHub repo: **Settings → Pages**.
3. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Save.
5. Your site URL will be:
   - `https://<your-github-username>.github.io/<repo-name>/` (project page)
   - or `https://<your-github-username>.github.io/` (user page repo).

## How to use after deploy

1. Open your GitHub Pages URL.
2. Navigate portfolio sections for profile information.
3. Use chat box to ask questions like:
   - “What is Ahmed’s PhD research focus?”
   - “List his publications.”
   - “What tools does he use?”
4. If info is not in the KB, bot should answer that it is not available in provided data.

## Update workflow (when CV/publications change)

1. Replace or add files in `data/raw/`.
2. Rebuild KB:
   ```bash
   node scripts/build-kb.mjs
   ```
3. Commit and push updated `data/kb.json` and raw files.
4. Redeploy worker (if KB is bundled there).

## Optional no-backend local demo (for testing only)

If you cannot deploy immediately, you can run frontend locally and hit a local worker dev URL (`wrangler dev`).
Do not ship production with keys in frontend.
