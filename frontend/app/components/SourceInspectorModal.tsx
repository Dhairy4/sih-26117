"use client";

interface SourceInspectorModalProps {
  sourceData: any;
  onClose: () => void;
}

export default function SourceInspectorModal({ sourceData, onClose }: SourceInspectorModalProps) {
  if (!sourceData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
        <div className="modal-header">
          <span className="modal-icon">📄</span>
          <div>
            <h2 className="modal-title">SOURCE</h2>
            <div className="modal-subtitle font-mono">{sourceData.source || "SOP-07"} • P-2104B Inspection Record</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-metadata-grid font-mono" style={{ margin: "16px 0" }}>
          <div className="meta-box">
            <span className="meta-label">SOURCE</span>
            <span className="meta-value">{sourceData.source || "SOP-07"}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">TAG</span>
            <span className="meta-value text-green">P-2104B</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">MATCH</span>
            <span className="meta-value text-green">Exact equipment tag</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">CITATION</span>
            <span className="meta-value">{sourceData.cite || "[S1]"}</span>
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <div className="section-label-row font-mono">CONTENT</div>
          <div className="source-content-box">
            {sourceData.text || "P-2104B inspection record. The pump showed increased vibration during operation. Inspection was scheduled for bearing and alignment checks."}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-black btn-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
