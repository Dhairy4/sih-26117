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
          <span className="modal-icon text-amber">⚠</span>
          <h2 className="modal-title font-sans">Review report</h2>
        </div>

        <div className="modal-body font-sans">
          <div className="font-bold text-primary text-base mb-1">
            P-2104B Investigation
          </div>

          <div className="text-muted text-xs font-mono mb-3">
            Evidence: <span className="text-cyan">[S1] SOP-07</span>
          </div>

          <p className="text-secondary text-sm mb-4">
            The report is based on 1 verified evidence source.
          </p>

          <div className="modal-actions font-sans">
            <button
              onClick={onCancel || onReject}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              className="btn btn-amber btn-lg"
            >
              Approve & Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
