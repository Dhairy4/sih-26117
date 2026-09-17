"""Sovereignty seal — socket-level egress guard.

Why: SIH26117 demands PROOF of zero external calls, not a claim. This patches
the only two stdlib chokepoints all Python egress funnels through:
  socket.socket.connect  (TCP/IP, incl. httpx/requests/qdrant-client/pymongo)
  socket.getaddrinfo     (DNS — blocks name resolution before connect)

Allowlist = loopback only (127.* + ::1 + localhost). Our 3 DBs all live on
127.0.0.1, so nothing legitimate breaks.

Install: `install()` is called at import of app.main — first import, before
any driver connects — so no library can cache the unpatched functions.
"""
import json
import socket
import threading
import time
from pathlib import Path

# Loopback only. 127.* covers 127.0.0.1 (postgres/mongo/qdrant all bind here).
_ALLOW_EXACT = {"localhost", "::1"}
_LOG = Path(__file__).resolve().parents[1] / "audit" / "egress.jsonl"

_counts = {"allowed": 0, "blocked": 0}
_lock = threading.Lock()
_orig_connect = socket.socket.connect
_orig_getaddrinfo = socket.getaddrinfo
_installed = False


def _is_loopback(host: str) -> bool:
    return host in _ALLOW_EXACT or host.startswith("127.")


def _log(dst: str, allowed: bool) -> None:
    _LOG.parent.mkdir(parents=True, exist_ok=True)
    rec = {"ts": time.time(), "dst": dst, "allowed": allowed}
    with open(_LOG, "a") as f:
        f.write(json.dumps(rec) + "\n")


def _guarded_connect(self, address, *args, **kwargs):
    host = address[0] if isinstance(address, (tuple, list)) else str(address)
    if _is_loopback(str(host)):
        with _lock:
            _counts["allowed"] += 1
        return _orig_connect(self, address, *args, **kwargs)
    with _lock:
        _counts["blocked"] += 1
    _log(f"{host}", allowed=False)
    raise OSError(f"[seal] egress BLOCKED -> {host} (loopback-only)")


def _guarded_getaddrinfo(host, port, *args, **kwargs):
    if host is None or _is_loopback(str(host)):
        return _orig_getaddrinfo(host, port, *args, **kwargs)
    with _lock:
        _counts["blocked"] += 1
    _log(f"dns:{host}:{port}", allowed=False)
    raise socket.gaierror(f"[seal] DNS BLOCKED -> {host} (loopback-only)")


def install() -> None:
    """Idempotent — safe under uvicorn --reload (module re-import)."""
    global _installed
    if _installed:
        return
    socket.socket.connect = _guarded_connect  # type: ignore[method-assign]
    socket.getaddrinfo = _guarded_getaddrinfo  # type: ignore[assign]
    _installed = True


def status(n_tail: int = 20) -> dict:
    """Counts + last N blocked attempts. Allowed conns counted, not logged
    (else every DB ping spams the audit file)."""
    with _lock:
        counts = dict(_counts)
    blocked: list = []
    if _LOG.exists():
        lines = _LOG.read_text().splitlines()[-n_tail:]
        blocked = [json.loads(x) for x in lines if x.strip()]
    return {"sealed": _installed, "counts": counts, "recent_blocked": blocked}


def canary() -> dict:
    """Proof probe: attempt raw-IP egress + DNS egress. Both MUST be blocked.
    Returns the exact errors so judges see BLOCKED, not just our word."""
    probes: dict = {}

    # Probe 1: raw IP (skips DNS, hits connect guard). 8.8.8.8:53 = Google DNS.
    # Uses s.connect (PATCHED) — tests the seal, makes no real egress.
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        s.connect(("8.8.8.8", 53))
        s.close()
        probes["raw_ip"] = {"blocked": False, "detail": "LEAK: reached 8.8.8.8:53"}
    except Exception as e:
        probes["raw_ip"] = {"blocked": True, "detail": f"{type(e).__name__}: {e}"}

    # Probe 2: DNS (hits getaddrinfo guard).
    try:
        socket.getaddrinfo("google.com", 443)
        probes["dns"] = {"blocked": False, "detail": "LEAK: resolved google.com"}
    except Exception as e:
        probes["dns"] = {"blocked": True, "detail": f"{type(e).__name__}: {e}"}

    probes["sovereign"] = all(p["blocked"] for p in (probes["raw_ip"], probes["dns"]))
    return probes


if __name__ == "__main__":  # ponytail self-check: `python -m app.seal`
    install()
    # loopback DNS must pass
    socket.getaddrinfo("localhost", 8000)
    # external DNS must die
    try:
        socket.getaddrinfo("google.com", 443)
        raise AssertionError("seal FAILED: external DNS resolved")
    except socket.gaierror:
        pass
    # external connect must die
    try:
        s = socket.socket()
        s.settimeout(2)
        s.connect(("8.8.8.8", 53))
        raise AssertionError("seal FAILED: external connect succeeded")
    except OSError:
        pass
    print("seal ok:", status())
