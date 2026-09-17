# Sovereign On-Premise Agentic AI Workbench (SIH26117)
## Build Log — Steps 1–4 Complete, Step 5 Next

**Repo:** `/home/dhairya/Desktop/SIH/sih-26117/`
**Stack:** FastAPI (Python) + Next.js 14 (React) + 3 local DBs + Ollama
**GPU:** CPU-only (15 GB RAM) — models sized for this box
**Date:** 2026-09-17

---

## Step 1 — Monorepo + Health Probes

**Files:**
- `backend/requirements.txt` — 6 pinned deps (`fastapi`, `uvicorn`, `psycopg2`, `pymongo`, `qdrant-client`, `pydantic-settings`)
- `backend/.env` — `POSTGRES_URL=postgresql://dhairya:dhairya@127.0.0.1:5432/postgres` (from `docker inspect`)
- `backend/app/db.py` — `ping_postgres/mongo/qdrant()` with short timeouts, no pooled connections
- `backend/app/main.py` — `GET /health` (liveness, no DB) + `GET /health/db` (readiness, all 3 isolated try/except)
- `frontend/` — Next.js 14 + TS, `app/page.tsx` fetches both endpoints, raw `<pre>` JSON

**Why this split:** SIH judges expect a Codex-like workbench (file uploads, agent trace, approval gates, network monitor). Streamlit (MIRA/LogPT) can't do interactive UI; Next.js owns the browser, Python owns LLM/OCR/RAG/sandbox/docx.

**Tradeoffs:** Two runtimes (`uvicorn` + `npm run dev`) vs one `streamlit run`. Accepted because judges click a real product, not a script.

**Verified:**
```json
/health     {"ok": true}
/health/db  postgres ok | mongo ok | qdrant ok (collections: documents, scibrain_papers, test1)
```

---

## Step 2 — Sovereignty Seal (Socket Guard + Audit + Canary)

**Files:**
- `backend/app/seal.py` — 130 lines, stdlib only. Monkey-patches `socket.socket.connect` + `socket.getaddrinfo` at import time. Allowlist = `127.*` + `::1` + `localhost`. Allowed conns **counted**, blocked conns **counted + JSONL logged** to `backend/audit/egress.jsonl`.
- `backend/app/main.py` — `seal_install()` runs **first import** (before any driver connects). `GET /sovereignty/status` + `POST /sovereignty/canary` (probes `8.8.8.8:53` and `google.com:443` — both must report `blocked:true`).
- `frontend/app/page.tsx` — seal panel (5 s poll) + RUN CANARY button.

**Why two chokepoints:** `connect` blocks TCP egress; `getaddrinfo` blocks DNS leakage. Patching only one leaves a hole.

**Tradeoffs:**
1. In-process guard, not kernel firewall — subprocesses (`curl`) bypass it. Step 5 sandbox gets network-namespace isolation separately.
2. Canary tests the **guard**, not the cable — on a dev machine with internet the guard still blocks (verified). Physical air-gap = demo theater.
3. Audit is local JSONL, not Postgres — evidence survives DB outage; tamper-evidence (hash chain) added in Step 5.

**Verified:**
```json
POST /sovereignty/canary
{"raw_ip":{"blocked":true},"dns":{"blocked":true},"sovereign":true}
/health/db with seal ON → all 3 DBs still ok (allowlist works, 4 allowed counted)
```

---

## Step 3 — Model Registry + 2-Stage Router

**Files:**
- `backend/models.yaml` — 4 entries: `coder` (qwen2.5-coder:1.5b), `general` (qwen2.5:1.5b), `vision` (qwen2.5vl:3b), `embed` (nomic-embed-text). `vram_gb` + `keywords` per route. `embed` has empty keywords → never a route target.
- `backend/app/router.py` — Stage 1: keyword scoring (strict margin `best > second`). Stage 2 (tie/zero): LLM judge via local Ollama `urllib` call. Two honest fallbacks (`keyword-fallback`) labeled: model-not-pulled + exact `ollama pull` command, and request-exception (Ollama down). `pulled_models()` parses `ollama list` subprocess, never crashes endpoint.
- `backend/app/main.py` — `GET /models` (registry × pulled status) + `POST /route` (`{text}` → full verdict with `scores`, `stage`, `model`).
- `frontend/app/page.tsx` — models panel + route tester (prefilled examples).

**Why 2-stage:** Stage 1 is free, instant, explainable (scores visible). Stage 2 costs one inference; running it on every request doubles latency for zero gain on obvious cases.

**Box constraints drove sizes:** Ollama 0.34, **zero models pulled**, no GPU, 15 GB RAM → 1.5–3B variants. When GPU arrives, change `ollama:` values in YAML only.

**Verified:**
```
/models → pulled: [], 4 entries with pulled:false
/route "write a python function..." → {"route":"coder","stage":"keyword","scores":{"coder":2}}
/route "read this scanned P&ID..."   → {"route":"vision","stage":"keyword"}
/route "hello" (tie, nothing pulled)  → {"route":"general","stage":"keyword-fallback"}
```

---

## Step 4 — RAG Ingestion + LangGraph Harness

**Files:**
- `backend/app/rag.py` —
  - Splitter: `RecursiveCharacterTextSplitter(500, 50)` (tuned for refinery findings).
  - Embeddings: `OllamaEmbeddings("nomic-embed-text")` (768-dim, local, seal-safe).
  - Vector store: `QdrantVectorStore(collection="sih_docs")`.
  - BM25: `BM25Retriever.from_documents(corpus)` rebuilt per search (ponytail: O(n) fine to ~2k chunks).
  - Ensemble: `EnsembleRetriever([dense, bm25], weights=[0.6, 0.4])` → RRF fusion inside LangChain.
  - Rerank: exact equipment-tag promotion (`TAG_RE = \b[A-Z]{1,3}-?\d+[A-Z]?\b`). Stable sort, tag hits first, fusion order preserved inside group.
  - Pack: top-k → `[S1] [S2]` cited context string.
  - Graph: `StateGraph(RAGState).add_node(retrieve→rerank→pack).compile()`.
  - `ingest(source, text, tags?)` — single `doc_id` written to Mongo (doc + chunks), Qdrant (vectors), Postgres `docs_ledger` (audit row).
  - `search(query, k)` — graph invoke → `{hits, context, detail}`.
  - `__main__` self-check: ingest P-2104B sample → assert top hit has `tag_hit` + tag in text.
- `backend/app/main.py` — `POST /ingest` + `POST /search`.
- `frontend/app/page.tsx` — ingest panel (prefilled SOP-07 sample) + search panel (prefilled query).
- `requirements.txt` — corrected pins to installed versions (`langchain 1.4.1`, `langgraph 1.2.11`, `langchain-qdrant 1.1.0`).

**Why LangChain/LangGraph here but not Steps 1–3:** Text splitters, embedding wrapper, `QdrantVectorStore`, `EnsembleRetriever` (dense+BM25 RRF), and a `retrieve→rerank→pack` `StateGraph` are exactly what they're built for. Hand-rolling ranking/fusion would be worse code. Steps 1–3 stayed stdlib/direct because health checks, a socket guard, and keyword scoring don't need a framework.

**Tradeoffs:**
1. `EnsembleRetriever` import has try/except (`langchain` → `langchain-classic`) because v1 moved it — fallback covers both (confirmed at runtime).
2. BM25 corpus rebuilt per search — O(n) on full Mongo scan. Ceiling: ~2k chunks; add incremental index when slow.
3. Two `pyright` grumbles on graph nodes are linter-only (partial-dict updates are LangGraph's documented pattern).

**Pending verification (reply "run it" to execute):**
- Restart uvicorn
- `python -m app.rag` (end-to-end embed → 3 stores → ensemble → tag assert)
- `curl /ingest` + `curl /search` live
- Frontend ingest/search panels

---

## Current State

| Step | Component | Status |
|------|-----------|--------|
| 1 | Monorepo, health, 3 DB probes, Next.js status page | ✅ verified |
| 2 | Socket seal, audit JSONL, canary, sovereignty endpoints | ✅ verified |
| 3 | Model registry (YAML), 2-stage router, model/status endpoints | ✅ verified |
| 4 | RAG ingest (Mongo+Qdrant+Postgres), LangGraph harness, ensemble retriever, tag rerank | 📝 code done, awaiting `run it` |
| 5 | Agent loop (LangGraph), sandboxed code exec, DOCX generator, human approval gate | ⏳ next |

---

## Next: Step 5 — Agentic Loop + Sandbox + DOCX

**Plan:**
- `backend/app/agent.py` — LangGraph `StateGraph`: `route → plan → (tool loop: retrieve|search|code|ocr|vision) → reflect → pack → respond`.
- Tools (universal contract `{success, output, error}` per LogPT):
  - `kb_search` → `/search` (Step 4 graph)
  - `code_exec` — subprocess + `resource` limits + network namespace (`--network none` if Docker, else `unshare -n`)
  - `file_read/write` — scoped to workspace
  - `make_docx` — `python-docx` template → approval gate → download
  - `ocr_vision` — `pytesseract` → `easyocr` → vision LLM (qwen2.5vl) tiered
- `POST /agent` — streams SSE (plan → tool calls → observations → final).
- Frontend: chat + agent trace panel + approval modal + deliverable download.

**Hardware gate:** `ollama pull qwen2.5:1.5b` (~1 GB) lights up router Stage 2; `qwen2.5-coder:1.5b` + `qwen2.5vl:3b` for coder/vision tools. On CPU each call 30–120 s; venue GPU bump to `:7b` in YAML only.

---

## Run Commands

```bash
# Backend
cd ~/Desktop/SIH/sih-26117/backend
./.venv/bin/uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload

# Frontend
cd ~/Desktop/SIH/sih-26117/frontend
npm run dev   # http://localhost:3000

# Self-checks
./.venv/bin/python -m app.seal
./.venv/bin/python -m app.router
./.venv/bin/python -m app.rag   # Step 4 verify (needs nomic-embed-text pulled)
```

---

## Key Design Decisions for Review

1. **Three DBs, not one** — Postgres (ACID ledger/relations), Mongo (flexible raw docs/OCR/chunks), Qdrant (HNSW + payload filtering). `doc_id` is the join key across all three.
2. **Seal is import-time, not middleware** — drivers import `socket` at module load; middleware runs too late.
3. **Router scores exposed** — `/route` returns `scores` so judges see *why* (`"scores":{"coder":2,"general":0,"vision":0}`).
4. **Ensemble weights fixed (0.6/0.4)** — dense paraphrases well, BM25 nails exact IDs (P-2104A vs P-2104B). Weights tunable later via config.
5. **No `python-dotenv`** — 6-line stdlib loader in `db.py`; interpolation ceiling documented.
6. **No Streamlit** — Next.js for real product UX; Python for heavy ML only.
7. **All local, no cloud keys** — Ollama, Qdrant, Postgres, Mongo all on 127.0.0.1; seal allows them, blocks world.