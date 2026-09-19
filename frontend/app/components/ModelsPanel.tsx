"use client";

interface ModelsPanelProps {
  modelsData: any;
  onClose: () => void;
}

export default function ModelsPanel({ modelsData, onClose }: ModelsPanelProps) {
  const modelsList = modelsData?.models || [
    { id: "general", name: "GENERAL", ollama: "qwen2.5:1.5b", pulled: false },
    { id: "coder", name: "CODER", ollama: "qwen2.5-coder:1.5b", pulled: false },
    { id: "vision", name: "VISION", ollama: "qwen2.5vl:3b", pulled: false },
    { id: "embed", name: "EMBEDDING", ollama: "nomic-embed-text", pulled: false },
  ];

  const pulledList = modelsData?.pulled || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <span className="modal-icon">🤖</span>
          <div>
            <h2 className="modal-title">MODELS</h2>
            <div className="modal-subtitle font-mono">Local Ollama model registry</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="models-simple-list" style={{ margin: "16px 0" }}>
          {modelsList.map((m: any) => {
            const isPulled = m.pulled || pulledList.includes(m.ollama);

            return (
              <div key={m.id || m.name} className="model-simple-row font-mono">
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "12px" }}>
                    {(m.id || m.name).toUpperCase()}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                    {m.ollama}
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: isPulled ? "var(--green-success)" : "var(--text-muted)" }}>
                  {isPulled ? "● Available" : "○ Not installed"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="modal-actions font-sans">
          <button onClick={onClose} className="btn btn-black btn-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
