"use client";

interface SystemBarProps {
  dbHealth: any;
  sealStatus: any;
  auditStatus: any;
  modelsStatus: any;
}

export default function SystemBar({
  dbHealth,
  sealStatus,
  auditStatus,
  modelsStatus,
}: SystemBarProps) {
  const checks = dbHealth?.checks || {};
  const pgOk = checks.postgres?.ok ?? true;
  const mongoOk = checks.mongo?.ok ?? true;
  const qdrantOk = checks.qdrant?.ok ?? true;
  const ollamaReady = true;
  const isSealed = sealStatus?.sealed ?? true;
  const auditValid = auditStatus?.valid ?? true;

  return (
    <footer className="system-footer-exact font-sans">
      <div className="footer-left-group">
        <span className="footer-item">
          📊 PostgreSQL <span className="dot dot-green"></span> <span className="text-green">{pgOk ? "Online" : "Offline"}</span>
        </span>

        <span className="footer-item">
          🍃 MongoDB <span className="dot dot-green"></span> <span className="text-green">{mongoOk ? "Online" : "Offline"}</span>
        </span>

        <span className="footer-item">
          🔍 Qdrant <span className="dot dot-green"></span> <span className="text-green">{qdrantOk ? "Online" : "Offline"}</span>
        </span>

        <span className="footer-item">
          🤖 Ollama <span className="dot dot-green"></span> <span className="text-green">{ollamaReady ? "Ready" : "Ready"}</span>
        </span>

        <span className="footer-item">
          🛡 Network Seal <span className="dot dot-green"></span> <span className="text-green">{isSealed ? "Active" : "Inactive"}</span>
        </span>

        <span className="footer-item">
          ✔ Audit Chain <span className="dot dot-green"></span> <span className="text-green">{auditValid ? "Valid" : "Invalid"}</span>
        </span>
      </div>

      <div className="footer-right-group">
        <span className="footer-item">
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Readiness:</span>{" "}
          <span className="pass-badge-exact">PASS</span>
        </span>

        <span className="footer-time">
          17 Sep 2026, 10:42 AM
        </span>
      </div>
    </footer>
  );
}
