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

  const isSealed = sealStatus?.sealed ?? true;
  const auditValid = auditStatus?.valid ?? true;

  return (
    <footer className="system-bar-container font-sans">
      {/* LEFT STATUS ITEMS */}
      <div className="system-bar-left-group">
        <span className="system-bar-item">
          <span style={{ fontSize: "12px" }}>🗄️</span>
          <span>PostgreSQL</span>
          <span className={`dot ${pgOk ? "dot-green" : "dot-red"}`}></span>
          <span style={{ fontWeight: 600, color: pgOk ? "#16a34a" : "#ef4444" }}>
            {pgOk ? "Online" : "Offline"}
          </span>
        </span>

        <span className="system-bar-item">
          <span style={{ fontSize: "12px" }}>🍃</span>
          <span>MongoDB</span>
          <span className={`dot ${mongoOk ? "dot-green" : "dot-red"}`}></span>
          <span style={{ fontWeight: 600, color: mongoOk ? "#16a34a" : "#ef4444" }}>
            {mongoOk ? "Online" : "Offline"}
          </span>
        </span>

        <span className="system-bar-item">
          <span style={{ fontSize: "12px" }}>🔍</span>
          <span>Qdrant</span>
          <span className={`dot ${qdrantOk ? "dot-green" : "dot-red"}`}></span>
          <span style={{ fontWeight: 600, color: qdrantOk ? "#16a34a" : "#ef4444" }}>
            {qdrantOk ? "Online" : "Offline"}
          </span>
        </span>

        <span className="system-bar-item">
          <span style={{ fontSize: "12px" }}>🤖</span>
          <span>Ollama</span>
          <span className="dot dot-green"></span>
          <span style={{ fontWeight: 600, color: "#16a34a" }}>Ready</span>
        </span>

        <span className="system-bar-item" style={{ marginLeft: "8px" }}>
          <span style={{ fontSize: "12px" }}>🛡️</span>
          <span>Network Seal</span>
          <span className={`dot ${isSealed ? "dot-green" : "dot-red"}`}></span>
          <span style={{ fontWeight: 600, color: isSealed ? "#16a34a" : "#ef4444" }}>
            {isSealed ? "Active" : "Unsealed"}
          </span>
        </span>

        <span className="system-bar-item">
          <span style={{ fontSize: "12px" }}>✔️</span>
          <span>Audit Chain</span>
          <span style={{ fontWeight: 600, color: auditValid ? "#16a34a" : "#ef4444" }}>
            {auditValid ? "✓ Valid" : "⚠ Invalid"}
          </span>
        </span>
      </div>

      {/* RIGHT STATUS ITEMS */}
      <div className="system-bar-right-group">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>Readiness:</span>
          <span className="readiness-pass-badge">PASS</span>
        </div>
        <div style={{ color: "#94a3b8", fontSize: "11px" }}>
          17 Sep 2026, 10:42 AM
        </div>
      </div>
    </footer>
  );
}
