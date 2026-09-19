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
          <span className="modal-icon text-cyan">📄</span>
          <div>
            <h2 className="modal-title font-mono">SOURCE INSPECTOR</h2>
            <div className="modal-subtitle font-mono">{sourceData.source || "SOP-07"}</div>
          </div>
          <button className="btn btn-xs btn-ghost modal-close font-mono" onClick={onClose}>✕</button>
        </div>

        <div className="modal-metadata-grid font-mono" style={{ margin: "14px 0" }}>
          <div className="meta-box">
            <span className="meta-label">SOURCE DOCUMENT</span>
            <span className="meta-value text-cyan">{sourceData.source || "SOP-07"}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">EQUIPMENT TAG</span>
            <span className="meta-value text-green">P-2104B</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">CITATION ID</span>
            <span className="meta-value text-cyan">{sourceData.cite || "[S1]"}</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">TAG MATCH</span>
            <span className="meta-value text-green">EXACT TAG MATCH ✓</span>
          </div>
        </div>

        <div className="section-block">
          <h4 className="section-title font-mono" style={{ marginBottom: "6px" }}>DOCUMENT CONTENT SNIPPET</h4>
          <div className="source-content-box">
            "{sourceData.text || "P-2104B inspection record. The pump showed increased vibration during operation. Inspection was scheduled for bearing and alignment checks. The equipment tag is P-2104B."}"
          </div>
        </div>

        <div className="modal-actions font-mono" style={{ marginTop: "16px" }}>
          <button onClick={onClose} className="btn btn-primary font-mono btn-full">
            CLOSE INSPECTOR
          </button>
        </div>
      </div>
    </div>
  );
}
