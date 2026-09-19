"use client";

interface ApprovalModalProps {
  approvalId: string;
  onApprove: () => void;
  onReject: () => void;
  onCancel?: () => void;
}

export default function ApprovalModal({
  approvalId,
  onApprove,
  onReject,
  onCancel,
}: ApprovalModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "440px" }}>
        <div className="modal-header">
          <span className="modal-icon text-amber">⚠️</span>
          <div>
            <h2 className="modal-title">Review report</h2>
            <div className="modal-subtitle">Human approval required</div>
          </div>
        </div>

        <div className="modal-body">
          <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)", marginBottom: "4px" }}>
            P-2104B Investigation
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
            Evidence: <span className="font-mono" style={{ fontWeight: 600, color: "var(--text-primary)" }}>[S1] SOP-07</span>
          </div>

          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.5" }}>
            The agent has gathered evidence and is ready to generate the official DOCX investigation report. Please confirm execution.
          </p>

          <div className="modal-actions">
            <button
              onClick={onCancel || onReject}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              className="btn"
              style={{ background: "#d97706", color: "#ffffff", border: "none" }}
            >
              Approve & Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
