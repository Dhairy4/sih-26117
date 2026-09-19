"""Step 5 Audit Logger with Tamper-Evident SHA-256 Hash Chain.

Structure per JSONL line:
  {
    "timestamp": 1726589000.123,
    "event": "tool_called",
    "request_id": "...",
    "tool": "kb_search",
    "success": true,
    "metadata": {...},
    "prev_hash": "GENESIS" | "<hex>",
    "hash": "<sha256 hex of canonical JSON excluding hash>"
  }
"""
import json
import hashlib
import time
import threading
from pathlib import Path
from typing import Any, Optional

AUDIT_FILE = (Path(__file__).resolve().parents[1] / "audit" / "agent.jsonl").resolve()
_lock = threading.Lock()


def _get_last_hash() -> str:
    if not AUDIT_FILE.exists():
        return "GENESIS"
    try:
        lines = AUDIT_FILE.read_text(encoding="utf-8").strip().splitlines()
        if not lines:
            return "GENESIS"
        last_entry = json.loads(lines[-1])
        return last_entry.get("hash", "GENESIS")
    except Exception:
        return "GENESIS"


def log_event(
    event: str,
    request_id: Optional[str] = None,
    tool: Optional[str] = None,
    success: Optional[bool] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> dict:
    """Log an audit event with prev_hash chain and SHA-256 validation hash."""
    AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with _lock:
        prev_hash = _get_last_hash()

        rec = {
            "timestamp": time.time(),
            "event": event,
            "request_id": request_id or "",
            "tool": tool or "",
            "success": success if success is not None else True,
            "metadata": metadata or {},
            "prev_hash": prev_hash,
        }

        # Canonical JSON string for hashing
        canonical_str = json.dumps(rec, sort_keys=True, separators=(",", ":"))
        rec["hash"] = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

        with open(AUDIT_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec) + "\n")

    return rec
