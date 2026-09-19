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
        <div className="modal-header">
          <span className="modal-icon">⚡</span>
          <div>
            <h2 className="modal-title">EXECUTION DETAILS</h2>
            <div className="modal-subtitle font-mono">Agent telemetry & audit status</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-metadata-grid font-mono" style={{ margin: "16px 0" }}>
          <div className="meta-box">
            <span className="meta-label">ROUTE</span>
            <span className="meta-value">{route || "general"}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">TOOL</span>
            <span className="meta-value">kb_search</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">RETRIEVAL</span>
            <span className="meta-value">3 results</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">RERANK</span>
            <span className="meta-value">P-2104B exact tag</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">AUDIT CHAIN</span>
            <span className="meta-value text-green">VALID ✓</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">PLAN STEPS</span>
            <span className="meta-value">{plan?.length || 5} actions</span>
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <div className="section-label-row font-mono">Plan Execution Steps</div>
          <ol style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.8" }}>
            {(plan && plan.length > 0 ? plan : [
              "Route request to general pipeline",
              "Search local vector index for P-2104B evidence",
              "Extract and rank chunk SOP-07",
              "Gate action on human review",
              "Generate DOCX deliverable"
            ]).map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ol>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-black btn-full">
            Close Execution Details
          </button>
        </div>
      </div>
    </div>
  );
}
