"""2-stage task router (LogPT pattern, minimal).

Stage 1 — keywords (always runs, offline): score each route by keyword hits.
  Clear winner (margin >= 1) -> return immediately, no LLM call, no latency.
Stage 2 — LLM judge (only on tie/zero): ask the general model to classify.
  Ollama missing/model unpulled -> fall back to `general`, say so honestly.

Why two stages: Stage 1 is free and explainable (scores visible = judge sees
WHY). Stage 2 costs one inference; running it on every request would double
latency for zero gain on obvious cases ("write python..." is never vision).
"""
import re
import subprocess
from functools import lru_cache
from pathlib import Path

import yaml

_REGISTRY = Path(__file__).resolve().parents[1] / "models.yaml"
OLLAMA_URL = "http://127.0.0.1:11434"  # local daemon — loopback, seal-safe


@lru_cache(maxsize=1)
def registry() -> dict:
    """Parsed once; uvicorn --reload re-imports on models.yaml edits."""
    return yaml.safe_load(_REGISTRY.read_text())


def _routable() -> list:
    return [m for m in registry()["models"] if m.get("keywords")]


def stage1(text: str) -> dict:
    """Keyword score per route. Pure function — trivially testable."""
    words = set(re.findall(r"[a-z0-9]+", text.lower()))
    scores = {m["id"]: len(words & set(m["keywords"])) for m in _routable()}
    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    (best, best_n), (_, second_n) = ranked[0], ranked[1]
    return {"scores": scores, "winner": best if best_n > second_n else None}


def pulled_models() -> list:
    """`ollama list` names. Never raises — endpoint must work w/o Ollama."""
    try:
        out = subprocess.run(
            ["ollama", "list"], capture_output=True, text=True, timeout=10
        ).stdout
        return [l.split()[0] for l in out.splitlines()[1:] if l.strip()]
    except Exception:
        return []


def stage2(text: str, candidates: list) -> dict:
    """LLM tie-break via local Ollama. Honest fallback when unavailable."""
    general = next(m["ollama"] for m in _routable() if m["id"] == "general")
    if general not in pulled_models():
        # ponytail: no stub LLM, no fake scores — report the fallback plainly
        return {"route": "general", "stage": "keyword-fallback",
                "detail": f"{general} not pulled; defaulting (run: ollama pull {general})"}
    import urllib.request  # stdlib — seal allows 127.0.0.1, no new dep

    prompt = (
        "Classify the task into ONE word: "
        + ", ".join(candidates)
        + f". Task: {text[:500]} Reply with only the word."
    )
    body = (
        '{"model":"%s","prompt":%s,"stream":false}'
        % (general, __import__("json").dumps(prompt))
    ).encode()
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/generate", data=body)
        with urllib.request.urlopen(req, timeout=120) as r:
            ans = __import__("json").load(r)["response"].strip().lower()
        route = next((c for c in candidates if c in ans), "general")
        return {"route": route, "stage": "llm-judge", "detail": ans[:100]}
    except Exception as e:  # Ollama down mid-request — degrade, don't 500
        return {"route": "general", "stage": "keyword-fallback",
                "detail": f"{type(e).__name__}: {e}"}


def route(text: str) -> dict:
    """Single entry point. Returns route + model + stage + scores."""
    s1 = stage1(text)
    if s1["winner"]:
        chosen = s1["winner"]
        out = {"route": chosen, "stage": "keyword", "detail": "clear keyword winner"}
    else:
        r2 = stage2(text, [m["id"] for m in _routable()])
        chosen, out = r2["route"], r2
    model = next(m["ollama"] for m in _routable() if m["id"] == chosen)
    return {"route": chosen, "model": model, "scores": s1["scores"], **out}


if __name__ == "__main__":  # ponytail self-check: `python -m app.router`
    r = route("write a python function to parse pump CSV")
    assert r["route"] == "coder", r
    r = route("summarize this inspection report for the approval note")
    assert r["route"] == "general", r
    r = route("read this scanned P&ID drawing and list valves")
    assert r["route"] == "vision", r
    r = route("hello")  # zero keywords -> tie -> honest fallback, never crash
    assert r["stage"] == "keyword-fallback", r
    print("router ok:", r)
