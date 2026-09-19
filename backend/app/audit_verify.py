"""Audit Chain Verifier script — python -m app.audit_verify.

Recomputes SHA-256 hashes sequentially across agent.jsonl to prove chain integrity.
"""
import json
import hashlib
from pathlib import Path

AUDIT_FILE = (Path(__file__).resolve().parents[1] / "audit" / "agent.jsonl").resolve()


def verify_chain() -> dict:
    if not AUDIT_FILE.exists():
        return {"valid": True, "count": 0, "message": "No audit entries logged yet"}

    lines = AUDIT_FILE.read_text(encoding="utf-8").strip().splitlines()
    if not lines:
        return {"valid": True, "count": 0, "message": "Audit file is empty"}

    expected_prev = "GENESIS"

    for idx, line in enumerate(lines, start=1):
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except Exception as e:
            return {
                "valid": False,
                "count": len(lines),
                "broken_entry": idx,
                "error": f"Invalid JSON on line {idx}: {e}"
            }

        prev_hash = entry.get("prev_hash")
        entry_hash = entry.get("hash")

        if prev_hash != expected_prev:
            return {
                "valid": False,
                "count": len(lines),
                "broken_entry": idx,
                "error": f"Line {idx} prev_hash mismatch: expected '{expected_prev}', got '{prev_hash}'"
            }

        # Re-compute hash of canonical JSON excluding hash
        entry_copy = {k: v for k, v in entry.items() if k != "hash"}
        canonical_str = json.dumps(entry_copy, sort_keys=True, separators=(",", ":"))
        calc_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

        if calc_hash != entry_hash:
            return {
                "valid": False,
                "count": len(lines),
                "broken_entry": idx,
                "error": f"Line {idx} hash mismatch: computed '{calc_hash}', recorded '{entry_hash}'"
            }

        expected_prev = entry_hash

    return {"valid": True, "count": len(lines), "message": "Hash chain VALID"}


if __name__ == "__main__":
    res = verify_chain()
    print(f"Audit entries: {res['count']}")
    if res["valid"]:
        print("Hash chain: VALID")
    else:
        print("Hash chain: INVALID")
        print(f"Broken entry: {res.get('broken_entry')}")
        print(f"Detail: {res.get('error')}")
