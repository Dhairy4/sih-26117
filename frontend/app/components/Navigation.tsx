"use client";

interface NavigationProps {
  onOpenModels: () => void;
  onOpenSovereignty: () => void;
  onOpenAudit: () => void;
  onOpenSystemStatus: () => void;
}

export default function Navigation({
  onOpenModels,
  onOpenSovereignty,
  onOpenAudit,
  onOpenSystemStatus,
}: NavigationProps) {
  return (
    <nav className="secondary-nav-container font-mono">
      <div className="nav-tabs-list">
        <button className="nav-tab-btn active">💻 WORKSPACE</button>
        <button className="nav-tab-btn" onClick={onOpenModels}>🤖 MODELS</button>
        <button className="nav-tab-btn" onClick={onOpenSovereignty}>🛡️ SOVEREIGNTY</button>
        <button className="nav-tab-btn" onClick={onOpenAudit}>📜 AUDIT LOGS</button>
      </div>

      <div className="nav-quick-info text-dim">
        <span>ON-PREMISE LOOPBACK (127.0.0.1)</span>
      </div>
    </nav>
  );
}
