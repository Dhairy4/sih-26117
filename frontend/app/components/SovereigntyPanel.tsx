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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <span className="modal-icon">🛡️</span>
          <div>
            <h2 className="modal-title">SOVEREIGNTY</h2>
            <div className="modal-subtitle font-mono">Air-gapped network seal & socket protection</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="sov-status-row font-mono">
            <span>Network</span>
            <span className={isSealed ? "text-green font-bold" : "text-red font-bold"}>
              ● {isSealed ? "SEALED" : "UNSEALED"}
            </span>
          </div>

          <div className="sov-status-row font-mono">
            <span>External TCP</span>
            <span style={{ fontWeight: 600 }}>Blocked</span>
          </div>

          <div className="sov-status-row font-mono">
            <span>External DNS</span>
            <span style={{ fontWeight: 600 }}>Blocked</span>
          </div>

          <div className="sov-status-row font-mono">
            <span>Local services</span>
            <span className="text-green font-bold">Allowed</span>
          </div>

          <div className="sov-status-row font-mono">
            <span>Audit Chain</span>
            <span className="text-green font-bold">✓ Valid</span>
          </div>

          {canaryResult && (
            <div style={{ marginTop: "14px" }}>
              <div className="section-label-row font-mono">Canary Verification Output</div>
              <pre className="canary-result-box font-mono">
                {typeof canaryResult === "string" ? canaryResult : JSON.stringify(canaryResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="modal-actions font-sans" style={{ marginTop: "20px" }}>
            <button
              onClick={onRunCanary}
              disabled={isRunningCanary}
              className="btn btn-black btn-full"
            >
              {isRunningCanary ? "Testing..." : "Run Canary"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
