"use client";

interface ModelsPanelProps {
  modelsData: any;
  onClose: () => void;
}

export default function ModelsPanel({ modelsData, onClose }: ModelsPanelProps) {
  const modelsList = modelsData?.models || [
    { id: "general", name: "General", ollama: "qwen2.5:1.5b", pulled: false },
    { id: "coder", name: "Coder", ollama: "qwen2.5-coder:1.5b", pulled: false },
    { id: "vision", name: "Vision", ollama: "qwen2.5vl:3b", pulled: false },
    { id: "embed", name: "Embedding", ollama: "nomic-embed-text", pulled: false },
  ];

  const pulledList = modelsData?.pulled || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <div className="modal-header font-sans">
          <span className="modal-icon text-cyan">🤖</span>
          <h2 className="modal-title font-sans">MODELS</h2>
          <button className="btn btn-xs btn-ghost modal-close font-mono" onClick={onClose}>✕</button>
        </div>

        <div className="models-simple-list font-sans" style={{ margin: "14px 0" }}>
          {modelsList.map((m: any) => {
            const isPulled = m.pulled || pulledList.includes(m.ollama);

            return (
              <div key={m.id} className="model-simple-row font-mono">
                <div>
                  <div className="font-bold text-primary">{m.id ? m.id.toUpperCase() : "MODEL"}</div>
                  <div className="text-muted text-xs">{m.ollama}</div>
                </div>
                <span className={`model-status-badge ${isPulled ? "text-green" : "text-amber"}`}>
                  {isPulled ? "● Available" : "○ Not installed"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="modal-actions font-sans">
          <button onClick={onClose} className="btn btn-primary btn-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
