---
name: run
description: Launch the "Генератор описаний вакансий" Flask app locally so changes can be tried in the browser. Use when asked to run, start, restart, or check this project's site.
---

# Running the vacancy-description generator

Flask app with a plain HTML/CSS/JS frontend. Backend calls an LLM through an OpenAI-SDK-compatible endpoint (currently ProxyAPI, `https://api.proxyapi.ru/v1`, model `openai/gpt-5-mini`).

## Prerequisites

- `venv/` must exist with deps installed. If missing: `python3 -m venv venv && ./venv/bin/pip install -q -r requirements.txt`.
- `.env` must exist with a real `OPENAI_API_KEY` (ProxyAPI key, not a direct OpenAI key), plus `OPENAI_MODEL` and `OPENAI_BASE_URL`. If missing, copy `.env.example` and fill in the key — ask the user for it if you don't have one.

## Start the server

1. Check if something is already listening on port 5000: `lsof -ti:5000`. If a prior instance of this app's `app.py` is running, confirm with the user before killing it (another process, e.g. macOS ControlCenter/AirPlay, can also hold port 5000 — don't kill that).
2. **Important:** the shell environment may already have a stale `OPENAI_API_KEY`/`OPENAI_MODEL`/`OPENAI_BASE_URL` set (e.g. a direct OpenAI key) that would shadow `.env`, since `python-dotenv`'s `load_dotenv()` does not override existing env vars. Start with those unset so `.env` wins:
   ```
   cd "description generator"
   env -u OPENAI_API_KEY -u OPENAI_MODEL -u OPENAI_BASE_URL nohup ./venv/bin/python app.py > /tmp/flask_run.log 2>&1 &
   disown
   ```
3. Wait ~1.5s, then check `/tmp/flask_run.log` for startup errors (e.g. missing API key causes a fast, clean exit with a Russian error message).
4. Verify it's up: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/` should return `200`.

## Verify generation works end-to-end

POST a sample payload and confirm it returns generated text (not an error):
```
curl -s -X POST http://127.0.0.1:5000/generate -H "Content-Type: application/json" -d '{
  "role": "Frontend-разработчик",
  "tasks": "Разработка интерфейсов на React",
  "requirements": "2+ года опыта с React",
  "platform": "hh",
  "text_style": "neutral"
}'
```
Known errors and fixes:
- `401 Invalid API Key` → the `OPENAI_API_KEY` in `.env` is wrong/stale for ProxyAPI (not a direct OpenAI key).
- `insufficient_quota` / `credit_balance_exhausted` → add credits/balance to the API account.
- `Unsupported parameter: 'max_tokens'` → already fixed in `app.py` (uses `max_completion_tokens` for GPT-5-family models); if it recurs after a model change, check whether the new model needs the old `max_tokens` param instead.

## Hand off to the user

Tell the user the app is running at `http://127.0.0.1:5000/` so they can use the actual form in a browser.

## Stop the server

Find the PID with `lsof -ti:5000`, inspect with `ps -p <pid> -o pid,ppid,command` to confirm it's this app's `app.py` (not an unrelated process), then kill only those PIDs — always confirm with the user before killing, since `pkill`/broad kills are blocked by the permission classifier anyway.
