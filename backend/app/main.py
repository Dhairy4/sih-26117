"""SIH-26117 backend — Step 1: health + per-DB probes.

Run:  uvicorn app.main:app --reload --port 8000   (from backend/)
Docs: http://127.0.0.1:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.seal import install as seal_install, status as seal_status, canary as seal_canary

seal_install()  # FIRST import-side effect: patch sockets before any driver connects

from app.db import ping_postgres, ping_mongo, ping_qdrant
from app.router import route as route_text, registry as model_registry, pulled_models
from app import rag as rag_mod

app = FastAPI(title="Sovereign Workbench API", version="0.1.0")

# ponytail: open CORS for dev only; lock to frontend origin before demo/prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Liveness: is the API process up? No DB touched."""
    return {"ok": True, "service": "sovereign-workbench", "version": "0.1.0"}


@app.get("/health/db")
def health_db():
    """Readiness: can we reach each of the 3 stores? Each probe isolated
    in try/except so one dead DB doesn't hide the status of the others."""
    out: dict = {"ok": True, "checks": {}}
    for name, fn in (
        ("postgres", ping_postgres),
        ("mongo", ping_mongo),
        ("qdrant", ping_qdrant),
    ):
        try:
            out["checks"][name] = {"ok": True, "detail": fn()}
        except Exception as e:  # noqa: BLE001 — health must serialize ANY failure
            out["ok"] = False
            out["checks"][name] = {"ok": False, "detail": f"{type(e).__name__}: {e}"}
    return out


@app.get("/sovereignty/status")
def sovereignty_status():
    """Live seal state: installed?, allowed/blocked counters, recent blocks."""
    return seal_status()


@app.post("/sovereignty/canary")
def sovereignty_canary():
    """Guard functional test: proves raw-IP + DNS egress are intercepted.
    NOTE: tests the SEAL, not the cable — on a dev machine with internet the
    guard still blocks (that's the point). Physical air-gap is demo theater."""
    return seal_canary()


@app.get("/models")
def list_models():
    """Registry as configured + which ollama models are actually pulled."""
    pulled = pulled_models()
    out = []
    for m in model_registry()["models"]:
        out.append({**m, "pulled": m["ollama"] in pulled})
    return {"pulled": pulled, "models": out}


@app.post("/route")
def classify(payload: dict):
    """Route a task string -> {route, model, stage, scores}. Empty text 400s."""
    text = (payload.get("text") or "").strip()
    if not text:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="text required")
    return route_text(text)


@app.post("/ingest")
def ingest_doc(payload: dict):
    """Store a document across Mongo + Qdrant + Postgres ledger."""
    source = (payload.get("source") or "").strip() or "untitled"
    text = (payload.get("text") or "").strip()
    if not text:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="text required")
    tags = payload.get("tags") or []
    return rag_mod.ingest(source=source, text=text, tags=tags)


@app.post("/search")
def search_docs(payload: dict):
    """LangGraph harness: retrieve -> rerank -> pack. Returns cited context."""
    query = (payload.get("query") or "").strip()
    if not query:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="query required")
    try:
        k = int(payload.get("k", 4))
    except (TypeError, ValueError):
        k = 4
    return rag_mod.search(query=query, k=k)


if __name__ == "__main__":  # `python -m app.main` fallback
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
