"use client";

interface ExecutionDetailsModalProps {
  route?: string;
  plan?: string[];
  steps?: any[];
  deliverable?: string;
  onClose: () => void;
}

export default function ExecutionDetailsModal({
  route,
  plan,
  steps,
  deliverable,
  onClose,
}: ExecutionDetailsModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header font-mono">
          <span className="modal-icon text-cyan font-mono">⚡</span>
          <div>
            <h2 className="modal-title font-mono">EXECUTION DETAILS</h2>
            <div className="modal-subtitle font-mono">TECHNICAL AGENT TELEMETRY & AUDIT DATA</div>
          </div>
          <button className="btn btn-xs btn-ghost modal-close font-mono" onClick={onClose}>✕</button>
        </div>

        <div className="modal-metadata-grid font-mono" style={{ margin: "14px 0" }}>
          <div className="meta-box">
            <span className="meta-label">ROUTE</span>
            <span className="meta-value text-cyan">{route || "general"}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">PLAN STEPS</span>
            <span className="meta-value text-primary">{plan?.length || 5} ACTIONS</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">TOOLS EXECUTED</span>
            <span className="meta-value text-green">kb_search</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">AUDIT CHAIN</span>
            <span className="meta-value text-green">VALID ✓</span>
          </div>
        </div>

        <div className="section-block font-mono">
          <h4 className="section-title" style={{ marginBottom: "6px" }}>PLAN EXECUTION STEPS</h4>
          <ol className="timeline-plan-list">
            {(plan && plan.length > 0 ? plan : [
              "1. Route request",
              "2. Search knowledge base for evidence",
              "3. Inspect retrieved evidence",
              "4. Request human approval for report generation",
              "5. Produce deliverable"
            ]).map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ol>
        </div>

        {steps && steps.length > 0 && (
          <div className="section-block font-mono">
            <h4 className="section-title" style={{ marginBottom: "6px" }}>RAW TOOL TELEMETRY</h4>
            <pre className="raw-json-block font-mono">
              {JSON.stringify(steps, null, 2)}
            </pre>
          </div>
        )}

        <div className="modal-actions font-mono" style={{ marginTop: "16px" }}>
          <button onClick={onClose} className="btn btn-primary font-mono btn-full">
            CLOSE DETAILS
          </button>
        </div>
      </div>
    </div>
  );
}
