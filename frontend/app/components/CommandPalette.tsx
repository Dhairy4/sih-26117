"use client";

import { useEffect, useState } from "react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state trigger
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: "investigate", title: "Investigate Equipment (P-2104B)", category: "Agent Action", icon: "🔍" },
    { id: "generate_report", title: "Generate Report (P-2104B)", category: "Agent Action", icon: "📄" },
    { id: "search_kb", title: "Search Knowledge Base", category: "Knowledge", icon: "📚" },
    { id: "add_document", title: "Add Document to Knowledge Base", category: "Knowledge", icon: "➕" },
    { id: "open_models", title: "Inspect Local Model Registry", category: "System", icon: "🤖" },
    { id: "open_sovereignty", title: "Open Sovereignty Control Center", category: "Security", icon: "🛡️" },
    { id: "open_audit", title: "Verify Audit Hash Chain", category: "Security", icon: "📜" },
    { id: "open_system", title: "View System Health & Services", category: "System", icon: "📊" },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-header">
          <span className="command-search-icon">⌕</span>
          <input
            type="text"
            className="command-search-input font-mono"
            placeholder="Type a command or search actions... (Esc to cancel)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <kbd className="command-kbd">ESC</kbd>
        </div>

        <div className="command-palette-list">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                className="command-item"
                onClick={() => {
                  onSelectAction(item.id);
                  onClose();
                }}
              >
                <span className="command-item-icon">{item.icon}</span>
                <div className="command-item-details">
                  <span className="command-item-title">{item.title}</span>
                  <span className="command-item-category font-mono">{item.category}</span>
                </div>
                <span className="command-item-shortcut font-mono">↵ SELECT</span>
              </div>
            ))
          ) : (
            <div className="command-empty-state">No matching actions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
