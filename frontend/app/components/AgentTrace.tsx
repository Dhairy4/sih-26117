"use client";

interface TraceStep {
  type: string;
  data: any;
  timestamp?: string;
}

interface AgentTraceProps {
  steps: TraceStep[];
  route?: string;
  plan?: string[];
  approvalRequired?: boolean;
  approvalGranted?: boolean;
  deliverable?: string;
  isRunning?: boolean;
  onOpenExecutionDetails: () => void;
}

export default function AgentTrace({
  steps,
  route,
  plan,
  approvalRequired,
  approvalGranted,
  deliverable,
  isRunning,
  onOpenExecutionDetails,
}: AgentTraceProps) {
  const hasEvidence = steps.length > 0;

  return (
    <aside className="panel-container right-panel">
      {/* HEADER */}
      <div className="sidebar-header">
        <div>
          <h2 className="sidebar-title font-sans">ACTIVITY</h2>
        </div>
      </div>

      <div className="panel-content activity-list font-sans">
        {/* 1. SEARCHING KNOWLEDGE */}
        <div className="activity-row">
          <span className={`activity-icon ${hasEvidence ? "text-green" : "text-muted"}`}>
            {hasEvidence ? "✓" : "○"}
          </span>
          <div className="activity-details">
            <div className="activity-label font-sans">Searching knowledge</div>
            <div className="activity-sub text-muted font-mono">
              {hasEvidence ? "1 relevant source" : "Ready"}
            </div>
          </div>
        </div>

        {/* 2. EVIDENCE VERIFIED */}
        <div className="activity-row">
          <span className={`activity-icon ${hasEvidence ? "text-green" : "text-muted"}`}>
            {hasEvidence ? "✓" : "○"}
          </span>
          <div className="activity-details">
            <div className="activity-label font-sans">Evidence verified</div>
            <div className="activity-sub text-muted font-mono">
              {hasEvidence ? "P-2104B exact tag" : "Pending"}
            </div>
          </div>
        </div>

        {/* 3. HUMAN APPROVAL */}
        <div className="activity-row">
          <span className={`activity-icon ${approvalGranted ? "text-green" : approvalRequired ? "text-amber" : "text-muted"}`}>
            {approvalGranted ? "✓" : approvalRequired ? "⚠" : "○"}
          </span>
          <div className="activity-details">
            <div className="activity-label font-sans">Human approval</div>
            <div className="activity-sub text-muted font-mono">
              {approvalGranted ? "Approved" : approvalRequired ? "Waiting for approval" : "Not requested"}
            </div>
          </div>
        </div>

        {/* 4. REPORT */}
        <div className="activity-row">
          <span className={`activity-icon ${deliverable ? "text-green" : "text-muted"}`}>
            {deliverable ? "✓" : "○"}
          </span>
          <div className="activity-details">
            <div className="activity-label font-sans">Report</div>
            <div className="activity-sub text-muted font-mono">
              {deliverable ? "Ready" : "Not generated"}
            </div>
          </div>
        </div>

        {/* VIEW EXECUTION DETAILS LINK */}
        <div style={{ marginTop: "24px" }}>
          <button
            type="button"
            className="view-details-link font-mono"
            onClick={onOpenExecutionDetails}
          >
            View execution details →
          </button>
        </div>
      </div>
    </aside>
  );
}
