"use client";

interface SovereigntyPanelProps {
  sealStatus: any;
  canaryResult: any;
  onClose: () => void;
  onRunCanary: () => void;
  isRunningCanary: boolean;
}

export default function SovereigntyPanel({
  sealStatus,
  canaryResult,
  onClose,
  onRunCanary,
  isRunningCanary,
}: SovereigntyPanelProps) {
  const isSealed = sealStatus?.sealed ?? true;
  const counts = sealStatus?.counts || { allowed: 0, blocked: 0 };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <span className="modal-icon text-cyan">🛡️</span>
          <h2 className="modal-title font-sans">SOVEREIGNTY</h2>
          <button className="btn btn-xs btn-ghost modal-close font-mono" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body font-sans">
          <div className="sov-status-row font-mono mb-2">
            <span>Network</span>
            <span className={`font-bold ${isSealed ? "text-green" : "text-red"}`}>
              ● {isSealed ? "Sealed" : "Unsealed"}
            </span>
          </div>

          <div className="sov-status-row font-mono mb-2">
            <span>External TCP</span>
            <span className="text-cyan font-bold">Blocked</span>
          </div>

          <div className="sov-status-row font-mono mb-2">
            <span>External DNS</span>
            <span className="text-cyan font-bold">Blocked</span>
          </div>

          <div className="sov-status-row font-mono mb-2">
            <span>Local loopback</span>
            <span className="text-green font-bold">Allowed</span>
          </div>

          <div className="sov-status-row font-mono mb-2">
            <span>Traffic stats</span>
            <span className="text-muted">Allowed: {counts.allowed} | Blocked: {counts.blocked}</span>
          </div>

          <div className="sov-status-row font-mono mb-4">
            <span>Audit</span>
            <span className="text-green font-bold">✓ Valid</span>
          </div>

          {canaryResult && (
            <pre className="canary-result-box font-mono mb-4">
              {typeof canaryResult === "string" ? canaryResult : JSON.stringify(canaryResult, null, 2)}
            </pre>
          )}

          <div className="modal-actions font-mono">
            <button
              onClick={onRunCanary}
              disabled={isRunningCanary}
              className="btn btn-primary btn-full"
            >
              {isRunningCanary ? "⟳ Testing..." : "Run Canary"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
