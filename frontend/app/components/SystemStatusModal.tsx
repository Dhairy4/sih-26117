"use client";

interface SystemStatusModalProps {
  dbHealth: any;
  sealStatus: any;
  auditStatus: any;
  modelsStatus: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function SystemStatusModal({
  dbHealth,
  sealStatus,
  auditStatus,
  modelsStatus,
  onClose,
  onRefresh,
}: SystemStatusModalProps) {
  const checks = dbHealth?.checks || {};
  const pg = checks.postgres || { ok: false, error: "Unavailable" };
  const mongo = checks.mongo || { ok: false, error: "Unavailable" };
  const qdrant = checks.qdrant || { ok: false, error: "Unavailable" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">📊</span>
          <h2 className="modal-title">SYSTEM INFRASTRUCTURE & HEALTH STATUS</h2>
          <button className="btn btn-xs btn-ghost modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="sovereignty-grid">
          {/* POSTGRESQL */}
          <div className="sov-block">
            <h3 className="sov-block-title">POSTGRESQL (DB)</h3>
            <div className="meta-value">
              Status: <span className={pg.ok ? "text-green" : "text-red"}>{pg.ok ? "● ONLINE" : "❌ OFFLINE"}</span>
            </div>
            <div className="text-dim text-xs" style={{ marginTop: "4px" }}>
              Target: 127.0.0.1:5432
            </div>
            {pg.error && <div className="text-red text-xs mt-1">{pg.error}</div>}
          </div>

          {/* MONGODB */}
          <div className="sov-block">
            <h3 className="sov-block-title">MONGODB (DOCUMENTS)</h3>
            <div className="meta-value">
              Status: <span className={mongo.ok ? "text-green" : "text-red"}>{mongo.ok ? "● ONLINE" : "❌ OFFLINE"}</span>
            </div>
            <div className="text-dim text-xs" style={{ marginTop: "4px" }}>
              Target: 127.0.0.1:27017
            </div>
            {mongo.error && <div className="text-red text-xs mt-1">{mongo.error}</div>}
          </div>

          {/* QDRANT */}
          <div className="sov-block">
            <h3 className="sov-block-title">QDRANT (VECTOR DB)</h3>
            <div className="meta-value">
              Status: <span className={qdrant.ok ? "text-green" : "text-red"}>{qdrant.ok ? "● ONLINE" : "❌ OFFLINE"}</span>
            </div>
            <div className="text-dim text-xs" style={{ marginTop: "4px" }}>
              Target: 127.0.0.1:6333
            </div>
            {qdrant.error && <div className="text-red text-xs mt-1">{qdrant.error}</div>}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: "16px" }}>
          <button onClick={onRefresh} className="btn btn-secondary">
            ⟳ RE-CHECK ALL SERVICES
          </button>
          <button onClick={onClose} className="btn btn-primary">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
