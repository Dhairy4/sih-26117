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
    <header className="header-container font-sans">
      {/* LEFT: BRANDING */}
      <div className="header-brand">
        <div className="header-shield-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
        </div>
        <div className="header-title-col">
          <div className="header-title-row">
            <h1 className="header-title">SOVEREIGN AI WORKBENCH</h1>
            <span className="header-badge-sih">SIH26117</span>
          </div>
          <span className="header-subtitle">ON-PREMISE AGENTIC INTELLIGENCE</span>
        </div>
      </div>

      {/* CENTER: WORKSPACE BREADCRUMB */}
      <div className="header-center-workspace">
        <span className="text-muted">Workspace</span>
        <span className="text-dim">/</span>
        <span className="ws-current">
          P-2104B Investigation
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </span>
      </div>

      {/* RIGHT: STATUS BADGES & DRAWER TRIGGERS & USER PROFILE */}
      <div className="header-controls">
        <span className="header-status-pill">
          <span className="dot dot-green"></span> LOCAL
        </span>

        <span className="header-status-pill" onClick={onOpenSovereignty} style={{ cursor: "pointer" }}>
          <span className={`dot ${isSealed ? "dot-green" : "dot-red"}`}></span> SECURE
        </span>

        <span className="header-status-pill" onClick={onOpenModels} style={{ cursor: "pointer" }}>
          <span className="dot dot-green"></span> ONLINE
        </span>

        <button className="header-icon-btn" onClick={onOpenSovereignty} title="Sovereignty Panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Sovereignty</span>
        </button>

        <button className="header-icon-btn" onClick={onOpenModels} title="Models Registry">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <span>Models</span>
        </button>

        <div className="header-avatar" title="User Profile">
          D
        </div>
      </div>
    </header>
  );
}
