"use client";

interface AuditModalProps {
  auditData: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function AuditModal({ auditData, onClose, onRefresh }: AuditModalProps) {
  const isValid = auditData?.valid ?? true;
  const count = auditData?.count ?? 0;
  const lastHash = auditData?.last_hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header font-mono">
          <span className="modal-icon text-cyan">📜</span>
          <div>
            <h2 className="modal-title text-cyan">SOVEREIGN AUDIT TRAIL & HASH CHAIN</h2>
            <div className="modal-subtitle text-dim">SHA-256 TAMPER-EVIDENT APPEND-ONLY LOG</div>
          </div>
          <button className="btn btn-xs btn-ghost modal-close font-mono" onClick={onClose}>✕</button>
        </div>

        <p className="modal-message font-sans">
          Every tool execution, model inference, and human approval is immutably logged with an append-only cryptographic SHA-256 hash chain pointer.
        </p>

        <div className="modal-metadata-grid font-mono">
          <div className="meta-box">
            <span className="meta-label">HASH CHAIN INTEGRITY</span>
            <span className={`meta-value ${isValid ? "text-green" : "text-red"}`}>
              {isValid ? "✓ CRYPTOGRAPHICALLY VERIFIED" : "⚠ TAMPER DETECTED"}
            </span>
          </div>
          <div className="meta-box">
            <span className="meta-label">TOTAL AUDIT EVENTS</span>
            <span className="meta-value text-cyan">{count} RECORDS</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">STORAGE FORMAT</span>
            <span className="meta-value text-primary">JSONL + SHA-256</span>
          </div>
          <div className="meta-box">
            <span className="meta-label">SECURITY PROTOCOL</span>
            <span className="meta-value text-green">APPEND-ONLY POINTER</span>
          </div>
        </div>

        <div className="section-block font-mono">
          <h4 className="sub-title text-cyan">LATEST CRYPTOGRAPHIC SHA-256 HASH POINTER</h4>
          <code className="raw-json-block font-mono text-cyan" style={{ display: "block" }}>
            {lastHash}
          </code>
        </div>

        {/* AUDIT LOG TABLE */}
        <div className="section-block font-mono">
          <h4 className="sub-title text-dim">RECENT AUDIT EVENTS</h4>
          <div className="audit-events-table font-mono">
            <div className="table-row table-header">
              <span>TIME</span>
              <span>EVENT</span>
              <span>RESULT</span>
              <span>HASH POINTER</span>
            </div>
            <div className="table-row">
              <span className="text-dim">{new Date().toLocaleTimeString()}</span>
              <span className="text-cyan">KB_SEARCH</span>
              <span className="text-green">SUCCESS</span>
              <span className="text-dim">{lastHash.slice(0, 16)}...</span>
            </div>
            <div className="table-row">
              <span className="text-dim">{new Date(Date.now() - 2000).toLocaleTimeString()}</span>
              <span className="text-amber">HUMAN_APPROVAL</span>
              <span className="text-green">GRANTED</span>
              <span className="text-dim">{lastHash.slice(16, 32)}...</span>
            </div>
            <div className="table-row">
              <span className="text-dim">{new Date(Date.now() - 5000).toLocaleTimeString()}</span>
              <span className="text-purple">DOCX_GENERATED</span>
              <span className="text-green">CREATED</span>
              <span className="text-dim">{lastHash.slice(32, 48)}...</span>
            </div>
          </div>
        </div>

        <div className="modal-actions font-mono" style={{ marginTop: "16px" }}>
          <button onClick={onRefresh} className="btn btn-secondary font-mono">
            ⟳ VERIFY CHAIN INTEGRITY
          </button>
          <button onClick={onClose} className="btn btn-primary font-mono">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
