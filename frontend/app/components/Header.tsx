"use client";

interface HeaderProps {
  sealStatus: any;
  onOpenSovereignty: () => void;
  onOpenModels: () => void;
}

export default function Header({
  sealStatus,
  onOpenSovereignty,
  onOpenModels,
}: HeaderProps) {
  const isSealed = sealStatus?.sealed ?? true;

  return (
    <header className="header-container">
      {/* LEFT BRANDING */}
      <div className="header-brand">
        <div className="header-shield-logo">
          🛡
        </div>
        <div>
          <div className="header-title-row">
            <h1 className="header-title">SOVEREIGN AI WORKBENCH</h1>
            <span className="header-badge-sih">SIH26117</span>
          </div>
          <div className="header-subtitle">ON-PREMISE AGENTIC INTELLIGENCE</div>
        </div>
      </div>

      {/* CENTER WORKSPACE DROPDOWN */}
      <div className="header-center-workspace">
        <span>Workspace</span>
        <span className="ws-sep">/</span>
        <span className="ws-item-active">P-2104B Investigation ▾</span>
      </div>

      {/* RIGHT STATUS & ACTIONS */}
      <div className="header-controls">
        <div className="header-status-pill-group">
          <span className="header-status-item">
            <span className="dot dot-green"></span> LOCAL
          </span>
          <span className="header-status-item">
            <span className={`dot ${isSealed ? "dot-green" : "dot-red"}`}></span> SECURE
          </span>
          <span className="header-status-item">
            <span className="dot dot-green"></span> ONLINE
          </span>
        </div>

        <button className="header-icon-btn" onClick={onOpenSovereignty} title="View Sovereignty Seal">
          <span className="icon">🛡️</span>
          <span>Sovereignty</span>
        </button>

        <button className="header-icon-btn" onClick={onOpenModels} title="View Model Registry">
          <span className="icon">🧩</span>
          <span>Models</span>
        </button>

        <div className="header-avatar" title="User Profile">
          D ▾
        </div>
      </div>
    </header>
  );
}
