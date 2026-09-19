"""SIH-26117 backend — Steps 1–5 Complete.

Run:  uvicorn app.main:app --reload --port 8000   (from backend/)
Docs: http://127.0.0.1:8000/docs
"""
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

from app.seal import install as seal_install, status as seal_status, canary as seal_canary

seal_install()  # FIRST import-side effect: patch sockets before any driver connects

from app.db import ping_postgres, ping_mongo, ping_qdrant
from app.router import route as route_text, registry as model_registry, pulled_models
from app import rag as rag_mod
from app import agent as agent_mod
from app import tools as tools_mod
from app import audit_verify as audit_verify_mod

app = FastAPI(title="Sovereign Workbench API", version="0.1.0")

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
    """Readiness: check each store, isolated try/except."""
    out: dict = {"ok": True, "checks": {}}
    for name, fn in (
        ("postgres", ping_postgres),
        ("mongo", ping_mongo),
        ("qdrant", ping_qdrant),
    ):
        try:
            out["checks"][name] = {"ok": True, "detail": fn()}
        except Exception as e:
            out["ok"] = False
            out["checks"][name] = {"ok": False, "detail": f"{type(e).__name__}: {e}"}
    return out


@app.get("/sovereignty/status")
def sovereignty_status():
    """Live seal state: installed?, allowed/blocked counters, recent blocks."""
    return seal_status()


@app.post("/sovereignty/canary")
def sovereignty_canary():
    """Guard functional test: proves raw-IP + DNS egress are intercepted."""
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
    """Route a task string -> {route, model, stage, scores}."""
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text required")
    return route_text(text)


@app.post("/ingest")
def ingest_doc(payload: dict):
    """Store a document across Mongo + Qdrant + Postgres ledger."""
    source = (payload.get("source") or "").strip() or "untitled"
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text required")
    tags = payload.get("tags") or []
    try:
        res = rag_mod.ingest(source=source, text=text, tags=tags)
        return {"success": True, **res}
    except Exception as e:
        return {"success": False, "error": f"{type(e).__name__}: {e}"}


@app.post("/search")
def search_docs(payload: dict):
    """LangGraph RAG harness search."""
    query = (payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query required")
    try:
        k = int(payload.get("k", 4))
    except (TypeError, ValueError):
        k = 4

    try:
        res = rag_mod.search(query=query, k=k)
        return {"success": True, **res}
    except Exception as e:
        err_msg = str(e)
        if "nomic-embed-text" in err_msg or "Ollama" in err_msg:
            return {
                "success": False,
                "error": "Embedding model not available. Pull nomic-embed-text with Ollama.",
            }
        return {"success": False, "error": f"{type(e).__name__}: {e}"}


# ---------------- STEP 5 AGENT ENDPOINTS ----------------

@app.post("/agent")
def agent_sse(payload: dict):
    """Server-Sent Events endpoint streaming agent steps live."""
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text required")

    def event_stream():
        try:
            res = agent_mod.run_agent(text)
            yield f"event: route\ndata: {json.dumps({'route': res.get('route')})}\n\n"
            yield f"event: plan\ndata: {json.dumps({'plan': res.get('plan')})}\n\n"

            for tc in res.get("tool_calls", []):
                yield f"event: tool_call\ndata: {json.dumps(tc)}\n\n"

            for obs in res.get("observations", []):
                yield f"event: observation\ndata: {json.dumps(obs)}\n\n"

            if res.get("approval_required"):
                yield f"event: approval_required\ndata: {json.dumps({'approval_required': True, 'approval_id': res.get('approval_id')})}\n\n"

            yield f"event: final\ndata: {json.dumps({'final': res.get('final'), 'deliverable': res.get('deliverable'), 'citations': res.get('citations')})}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/agent/run")
def agent_run(payload: dict):
    """Synchronous JSON endpoint fallback for the agent."""
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text required")
    try:
        res = agent_mod.run_agent(text)
        return {"success": True, "result": res}
    except Exception as e:
        return {"success": False, "error": f"{type(e).__name__}: {e}"}


@app.post("/agent/approve")
def agent_approve(payload: dict):
    """Human approval endpoint for sensitive operations."""
    app_id = (payload.get("approval_id") or "").strip()
    action = (payload.get("action") or "approve").strip()
    if not app_id:
        raise HTTPException(status_code=400, detail="approval_id required")
    return agent_mod.approve_action(app_id, action)


@app.get("/deliverables/{filename}")
def download_deliverable(filename: str):
    """Safe download endpoint with path traversal protection."""
    try:
        safe_p = tools_mod._resolve_safe_path(filename, base_dir=tools_mod.DELIVERABLES_DIR)
        if not safe_p.exists():
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(path=safe_p, filename=safe_p.name, media_type="application/octet-stream")
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/audit/verify")
def audit_verify():
    """Returns status of the audit SHA-256 tamper-evident hash chain."""
    return audit_verify_mod.verify_chain()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
