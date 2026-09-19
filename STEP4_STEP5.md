# Sovereign On-Premise Agentic AI Workbench (SIH26117)
## Steps 4 & 5 Technical Architecture & Operations Guide

### Overview
This document provides full operational, architectural, and safety documentation for the **Sovereign On-Premise Agentic AI Workbench** developed for Problem ID **SIH26117**.

---

### Architecture & Data Flow

```
                      ┌──────────────────────────────────────────────┐
                      │           Next.js 14 Workbench UI            │
                      │  (Sovereignty | KB | Agent Chat | Trace UI)  │
                      └──────────────────────┬───────────────────────┘
                                             │ SSE / HTTP API
                                             ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                                FastAPI Server (Port 8000)                              │
  │                                                                                        │
  │  ┌────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  │
  │  │   Socket Seal Guard    │  │   2-Stage Model Router  │  │   LangGraph Agent       │  │
  │  │ (app/seal.py, 127.*)   │  │ (app/router.py, Ollama) │  │ (app/agent.py, State)   │  │
  │  └────────────────────────┘  └─────────────────────────┘  └────────────┬────────────┘  │
  │                                                                          │               │
  │                                   ┌──────────────────────────────────────┴────────────┐  │
  │                                   │             Tools (app/tools.py)                  │  │
  │                                   │ • KB Search (app/rag.py)                          │  │
  │                                   │ • Code Exec Sandbox (Subprocess/limits)           │  │
  │                                   │ • File Read / Write (workspace/ sandbox)          │  │
  │                                   │ • DOCX Generator (python-docx)                    │  │
  │                                   │ • OCR / Vision (Tesseract / EasyOCR / Ollama)     │  │
  │                                   └───────────────────────────────────────────────────┘  │
  │                                                                                          │
  │  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
  │  │                         Audit & Hash Chain (app/audit.py)                          │  │
  │  │                     (SHA-256 JSONL append with prev_hash chain)                    │  │
  │  └────────────────────────────────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────┬───────────────────────────────────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
      ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
      │   PostgreSQL    │           │     MongoDB     │           │     Qdrant      │
      │  (docs_ledger)  │           │  (docs & chunks)│           │   (sih_docs)    │
      └─────────────────┘           └─────────────────┘           └─────────────────┘
```

---

### Step 4 — RAG Pipeline Specifications
- **Text Splitter:** `RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)`.
- **Embeddings:** Local `OllamaEmbeddings("nomic-embed-text")` (768 dimensions).
- **Vector Store:** `QdrantVectorStore(collection="sih_docs")`.
- **Document & Chunk Storage:** MongoDB collection `sih_workbench.docs`.
- **Ingestion Audit Ledger:** PostgreSQL table `docs_ledger`.
- **Hybrid Retrieval:** `EnsembleRetriever` combining dense vector search (0.6) and BM25 text search (0.4) using Reciprocal Rank Fusion (RRF).
- **Equipment Tag Reranker:** Regex matching (`\b[A-Z]{1,3}-?\d+[A-Z]?\b`) promoting exact equipment matches (e.g. `P-2104B`, `V-102`, `E-301`).
- **Citation Pack:** Formats retrieved evidence as `[S1]`, `[S2]`, `[S3]` markers with source metadata.

---

### Step 5 — Agentic Workbench & Tools

#### State Graph
The agent is driven by a deterministic LangGraph `StateGraph`:
`route` ➔ `plan` ➔ `tool_step` ➔ `reflect` ➔ `respond`

#### Universal Tool Contract
All tools return a standardized response:
```json
// Success
{ "success": true, "output": { ... }, "error": null }

// Failure
{ "success": false, "output": null, "error": "Reason" }
```

#### Tools Overview
1. **`kb_search(query, k=5)`**: Direct Python invocation of RAG graph search.
2. **`code_exec(code, timeout=5)`**: Subprocess code execution in temporary directories with resource limits and network isolation checks.
3. **`file_read(path)`**: Read files strictly scoped under `backend/workspace/`.
4. **`file_write(path, content)`**: Write files strictly scoped under `backend/workspace/`.
5. **`make_docx(data)`**: Generates executive report DOCX using `python-docx` stored in `backend/workspace/deliverables/`.
6. **`ocr_vision(file_path)`**: Tiered OCR fallback (`pytesseract` ➔ `EasyOCR` ➔ `Ollama vision`).

---

### Security & Human Approval Gate

1. **Socket Seal Egress Guard:** Monkey-patches `socket.connect` and `socket.getaddrinfo` to restrict outgoing connections strictly to loopback (`127.*`, `::1`, `localhost`).
2. **Path Traversal Protection:** All file operations enforce `target_path.relative_to(base_workspace_dir)`. Attempts to escape via `../` or absolute paths return a `PermissionError`.
3. **Human Approval Gate:** Deliverable generation requires explicit approval. When requested, the agent sets `approval_required = True` and generates an `approval_id`. The user must click **Approve** (calling `POST /agent/approve`), which is verified backend-side before the document is generated and made downloadable.

---

### Tamper-Evident Audit Hash Chain

Every lifecycle event is recorded to `backend/audit/agent.jsonl` with a cryptographic SHA-256 hash chain:
- Initial event: `prev_hash = "GENESIS"`.
- Subsequent events: `prev_hash = previous_hash`.
- `hash = SHA256(canonical_json(event_data_without_hash))`.

Run verification anytime:
```bash
python -m app.audit_verify
```

---

### API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | GET | Liveness probe (no DB touch) |
| `/health/db` | GET | Readiness probe (PostgreSQL, MongoDB, Qdrant) |
| `/sovereignty/status` | GET | Live socket seal status and counters |
| `/sovereignty/canary` | POST | Egress block verification probe |
| `/models` | GET | Registry models and local Ollama pull status |
| `/route` | POST | 2-Stage task router classification |
| `/ingest` | POST | Ingest document to Mongo, Qdrant, and Postgres |
| `/search` | POST | Hybrid dense+BM25 search with tag reranking |
| `/agent` | POST | SSE endpoint streaming live agent steps |
| `/agent/run` | POST | Synchronous JSON agent execution fallback |
| `/agent/approve` | POST | Human approval handler for report creation |
| `/deliverables/{filename}`| GET | Safe file download endpoint |
| `/audit/verify` | GET | Verify SHA-256 audit chain integrity |

---

### Running Locally

```bash
# 1. Start Backend
cd backend
python -m app.main

# 2. Start Frontend
cd frontend
npm run dev
```
