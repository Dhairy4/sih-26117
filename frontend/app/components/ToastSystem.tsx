"use client";

export interface ToastMessage {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  detail?: string;
}

interface ToastSystemProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastSystem({ toasts, onDismiss }: ToastSystemProps) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const iconMap = {
          success: "✓",
          info: "ℹ",
          warning: "⚠",
          error: "✕",
        };

        return (
          <div key={t.id} className={`toast-card toast-${t.type}`}>
            <span className="toast-icon">{iconMap[t.type]}</span>
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              {t.detail && <div className="toast-detail font-mono">{t.detail}</div>}
            </div>
            <button className="toast-close" onClick={() => onDismiss(t.id)}>✕</button>
          </div>
        );
      })}
    </div>
  );
}
