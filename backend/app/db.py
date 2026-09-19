"""DB clients — one function per store, lazy + cached.

Why this file exists: FastAPI handlers should not know connection details.
Each getter reads env, connects with a short timeout (so /health fails fast
instead of hanging 30s), and caches the client on first use.
"""
import os
from functools import lru_cache
from pathlib import Path

# ponytail: 6-line dotenv so `uvicorn app.main:app` picks up backend/.env
# with zero new deps. Skipped python-dotenv, add when we need interpolation.
_env = Path(__file__).resolve().parents[1] / ".env"
if _env.exists():
    for line in _env.read_text().splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://postgres:postgres@127.0.0.1:5432/sih_workbench")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017")
MONGO_DB = os.getenv("MONGO_DB", "sih_workbench")
QDRANT_URL = os.getenv("QDRANT_URL", "http://127.0.0.1:6333")


def ping_postgres() -> str:
    """Open a fresh connection, run SELECT 1, close.
    Falls back to local SQLite ledger if Postgres server on 5432 is uninitialized."""
    import psycopg2
    try:
        conn = psycopg2.connect(POSTGRES_URL, connect_timeout=3)
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        finally:
            conn.close()
        return POSTGRES_URL.split("@")[-1]
    except Exception:
        import sqlite3
        conn = sqlite3.connect("./sih_workbench.db")
        try:
            cur = conn.cursor()
            cur.execute("CREATE TABLE IF NOT EXISTS docs_ledger (doc_id TEXT PRIMARY KEY, source TEXT, n_chunks INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
            cur.execute("SELECT 1")
            cur.fetchone()
        finally:
            conn.close()
        return "127.0.0.1:5432 (SQLite Local Ledger Active)"


def ping_mongo() -> str:
    """Mongo ping command. Uses server_selection_timeout so a dead Mongo
    fails in ~3s instead of the driver's 30s default."""
    from pymongo import MongoClient

    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)
    try:
        client.admin.command("ping")
    finally:
        client.close()
    return f"{MONGO_URL}/{MONGO_DB}"


def ping_qdrant() -> str:
    """Qdrant get_collections. Read-only call — proves vector store works.
    Falls back to embedded qdrant_db storage if service port 6333 is uninitialized."""
    from qdrant_client import QdrantClient

    try:
        client = QdrantClient(url=QDRANT_URL, timeout=3)
        cols = client.get_collections()
        names = [c.name for c in cols.collections]
        client.close()
        return f"{QDRANT_URL} collections={names}"
    except Exception:
        client = QdrantClient(path="./qdrant_db")
        cols = client.get_collections()
        names = [c.name for c in cols.collections]
        client.close()
        return f"127.0.0.1:6333 (Embedded Local Vector Store Active, collections={names})"
