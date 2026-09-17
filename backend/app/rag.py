"""Step 4 RAG — LangChain splitters/embeddings/retrievers + LangGraph harness.

Stores (same doc_id in all three = the join key from Step 1's mapping):
  Mongo    raw doc + chunk texts (flexible, human-readable, BM25 corpus)
  Qdrant   `sih_docs` vectors + payload (machine search)
  Postgres `docs_ledger` (doc_id, source, n_chunks, created_at)

Harness = LangGraph StateGraph: retrieve -> rerank -> pack.
  retrieve: EnsembleRetriever = dense Qdrant (0.6) + BM25 (0.4), fused with
            RRF inside LangChain. Two signals because dense paraphrases well
            but confuses lookalikes (P-2104A vs P-2104B); BM25 nails exact IDs.
  rerank:   exact equipment-tag promotion (MIRA pattern). Stable sort, no
            invented scores — a hit either contains the query's tag or not.
  pack:     top-k -> cited context string ([S1] [S2] markers).
Ingest is straight-line code, NOT a graph — nothing branches, so a graph
would be ceremony (ponytail: no unrequested abstractions).
"""
import re
import uuid
from typing import TypedDict

TAG_RE = re.compile(r"\b[A-Z]{1,3}-?\d+[A-Z]?\b")  # P-2104B, E-101, V-2204A
COLLECTION = "sih_docs"

try:  # langchain<1 kept it here; 1.x moved classics out
    from langchain.retrievers import EnsembleRetriever
except ImportError:
    from langchain_classic.retrievers import EnsembleRetriever

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_community.retrievers import BM25Retriever
from langgraph.graph import StateGraph, START, END
from qdrant_client import QdrantClient

from app.db import MONGO_URL, MONGO_DB, POSTGRES_URL, QDRANT_URL


def _emb():
    # nomic-embed-text, 768-dim, served by local Ollama (127.0.0.1: seal-safe)
    return OllamaEmbeddings(model="nomic-embed-text")


def _store():
    return QdrantVectorStore(
        client=QdrantClient(url=QDRANT_URL, timeout=10),
        collection_name=COLLECTION,
        embedding=_emb(),
    )


def _splitter():
    # 500 chars ~ one SOP finding + its context; 50 overlap keeps sentences
    # whole across boundaries. ponytail: tuned for refinery notes, revisit
    # when we ingest P&ID tables (cell-aware splitting then).
    return RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)


# ---------- ingest ----------

def ingest(source: str, text: str, tags: list | None = None) -> dict:
    from pymongo import MongoClient
    import psycopg2

    doc_id = uuid.uuid4().hex[:12]
    tags = sorted(set(tags or []) | set(TAG_RE.findall(text)))
    chunks = _splitter().split_text(text)

    mc = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    try:
        mc[MONGO_DB]["docs"].insert_one(
            {"doc_id": doc_id, "source": source, "text": text,
             "tags": tags, "chunks": chunks, "n_chunks": len(chunks)}
        )
    finally:
        mc.close()

    docs = [Document(page_content=c, metadata={
        "doc_id": doc_id, "chunk_idx": i, "source": source, "tags": tags})
        for i, c in enumerate(chunks)]
    _store().add_documents(docs)  # creates `sih_docs` (768-dim) on first call

    conn = psycopg2.connect(POSTGRES_URL, connect_timeout=5)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "CREATE TABLE IF NOT EXISTS docs_ledger"
                "(doc_id TEXT PRIMARY KEY, source TEXT, n_chunks INT,"
                " created_at TIMESTAMPTZ DEFAULT now())"
            )
            cur.execute(
                "INSERT INTO docs_ledger(doc_id, source, n_chunks)"
                " VALUES (%s,%s,%s) ON CONFLICT (doc_id) DO NOTHING",
                (doc_id, source, len(chunks)),
            )
        conn.commit()
    finally:
        conn.close()
    return {"doc_id": doc_id, "source": source, "n_chunks": len(chunks), "tags": tags}


# ---------- harness ----------

def _corpus() -> list:
    """All chunks as Documents — rebuilt per search.
    ponytail: O(n) rebuild, fine to ~2k chunks; add incremental index when slow."""
    from pymongo import MongoClient

    mc = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    try:
        cursor = mc[MONGO_DB]["docs"].find({}, {"doc_id": 1, "source": 1, "chunks": 1}).limit(2000)
        out = []
        for d in cursor:
            for i, c in enumerate(d.get("chunks", [])):
                out.append(Document(page_content=c, metadata={
                    "doc_id": d["doc_id"], "chunk_idx": i, "source": d.get("source", "")}))
        return out
    finally:
        mc.close()


class RAGState(TypedDict):
    # Nodes return partial dicts — the documented LangGraph pattern.
    # (Pyright flags partial updates; runtime merges them correctly.)
    query: str
    k: int
    fused: list  # [{text, source, doc_id, chunk_idx}] in fusion order
    ranked: list  # + tag_hit flag, tag matches promoted
    context: str
    detail: str


def _retrieve(s: RAGState) -> dict:
    corpus = _corpus()
    if not corpus:
        return {"fused": [], "detail": "empty corpus — POST /ingest first"}
    try:
        dense = _store().as_retriever(search_kwargs={"k": s["k"] * 2})
        bm25 = BM25Retriever.from_documents(corpus)
        ens = EnsembleRetriever(retrievers=[dense, bm25], weights=[0.6, 0.4])
        docs = ens.invoke(s["query"])
    except Exception as e:  # missing Qdrant collection, Ollama down, ...
        return {"fused": [], "detail": f"retrieve failed: {type(e).__name__}: {e}"}
    fused = [{"text": d.page_content, "source": d.metadata.get("source", ""),
              "doc_id": d.metadata.get("doc_id", ""),
              "chunk_idx": d.metadata.get("chunk_idx", 0)} for d in docs]
    return {"fused": fused, "detail": f"fused {len(fused)} (dense 0.6 + BM25 0.4)"}


def _rerank(s: RAGState) -> dict:
    qtags = set(TAG_RE.findall(s["query"].upper()))
    for d in s["fused"]:
        hay = d["text"].upper()
        d["tag_hit"] = bool(qtags and any(t in hay for t in qtags))
    # stable: tag hits first, fusion order preserved inside each group
    ranked = sorted(s["fused"], key=lambda d: (not d["tag_hit"],))
    return {"ranked": ranked}


def _pack(s: RAGState) -> dict:
    top = s["ranked"][: s["k"]]
    lines = [f"[S{i+1}] ({h['source']}#{h['chunk_idx']}) {h['text']}"
             for i, h in enumerate(top)]
    return {"context": "\n".join(lines),
            "ranked": [
                {"cite": f"S{i+1}", **h} for i, h in enumerate(top)]}


_graph = (
    StateGraph(RAGState)
    .add_node("retrieve", _retrieve)
    .add_node("rerank", _rerank)
    .add_node("pack", _pack)
    .add_edge(START, "retrieve")
    .add_edge("retrieve", "rerank")
    .add_edge("rerank", "pack")
    .add_edge("pack", END)
    .compile()
)


def search(query: str, k: int = 4) -> dict:
    out = _graph.invoke({"query": query, "k": max(1, min(k, 10)),
                         "fused": [], "ranked": [], "context": "", "detail": ""})
    return {"query": query, "detail": out["detail"],
            "hits": out["ranked"], "context": out["context"]}


if __name__ == "__main__":  # ponytail self-check: `python -m app.rag`
    SAMPLE = ("Inspection report 2026-08-14: pump P-2104B vibration 7.1 mm/s, "
              "limit 4.5 per SOP-07. Seal wear suspected. Sister pump P-2104A "
              "normal at 2.2 mm/s. Recommend work permit and bearing check.")
    r = ingest(source="SOP-07-sample", text=SAMPLE)
    assert r["n_chunks"] >= 1, r
    s = search("P-2104B vibration findings", k=2)
    assert s["hits"], s
    assert s["hits"][0]["tag_hit"] and "P-2104B" in s["hits"][0]["text"], s
    print("rag ok:", {k: s[k] for k in ("detail", "context")})
