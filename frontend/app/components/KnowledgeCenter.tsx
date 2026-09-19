"use client";

import { useState } from "react";

interface KnowledgeCenterProps {
  onIngest: (source: string, text: string, tags: string[]) => Promise<any>;
  onSearch: (query: string) => Promise<any>;
  searchResult: any;
  isSearching: boolean;
  onOpenSourceInspector: (sourceItem: any) => void;
}

export default function KnowledgeCenter({
  onIngest,
  onSearch,
  searchResult,
  isSearching,
  onOpenSourceInspector,
}: KnowledgeCenterProps) {
  const [documents, setDocuments] = useState<any[]>([
    {
      id: "sop-07-default",
      source: "SOP-07",
      title: "P-2104B Inspection Record",
      chunks: 1,
      tags: ["P-2104B"],
      status: "Indexed",
    },
  ]);

  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [sourceInput, setSourceInput] = useState("SOP-07");
  const [textInput, setTextInput] = useState(
    "P-2104B inspection record.\nThe pump showed increased vibration during operation.\nInspection was scheduled for bearing and alignment checks.\nThe equipment tag is P-2104B."
  );
  const [tagsInput, setTagsInput] = useState("P-2104B");
  const [ingestStage, setIngestStage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    try {
      setIngestStage("Processing...");
      const tagsList = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await onIngest(sourceInput, textInput, tagsList);

      setIngestStage("Indexed ✓");

      if (res && res.success) {
        setDocuments((prev) => [
          {
            id: res.doc_id || Date.now().toString(),
            source: sourceInput || "Untitled",
            title: textInput.slice(0, 30) + "...",
            chunks: res.n_chunks || 1,
            tags: tagsList,
            status: "Indexed",
          },
          ...prev,
        ]);
        setTimeout(() => {
          setShowAddDocModal(false);
          setIngestStage(null);
        }, 600);
      }
    } catch (err) {
      setIngestStage("Error");
      setTimeout(() => setIngestStage(null), 2000);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    await onSearch(searchQuery);
  };

  return (
    <aside className="panel-container left-panel font-sans">
      {/* SIDEBAR HEADER */}
      <div className="sidebar-header-box">
        <h2 className="sidebar-title-main">Knowledge</h2>
        <div className="sidebar-subtitle-main">Documents & evidence</div>
        <button
          type="button"
          className="btn-add-doc"
          onClick={() => setShowAddDocModal(true)}
        >
          <span>+</span> Add Document
        </button>
      </div>

      {/* SEARCH INPUT */}
      <div className="sidebar-search-box">
        <form onSubmit={handleSearchSubmit}>
          <div className="sidebar-search-input-wrapper">
            <span className="sidebar-search-icon">🔍</span>
            <input
              type="text"
              className="sidebar-search-input font-sans"
              placeholder="Search knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="sidebar-search-shortcut">Ctrl K</span>
          </div>
        </form>
      </div>

      {/* DOCUMENTS SECTION */}
      <div className="sidebar-section-title">
        <span>Documents ({documents.length})</span>
      </div>

      <div className="doc-list-container">
        {documents.map((doc) => (
          <div key={doc.id} className="doc-card-item">
            <div className="doc-icon-square">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div className="doc-info-col">
              <span className="doc-title-text">{doc.source}</span>
              <span className="doc-sub-text">{doc.title}</span>
              <div className="doc-status-row">
                <span className="dot dot-green"></span> Indexed
              </div>
            </div>
            <div className="doc-more-dots">⋮</div>
          </div>
        ))}
      </div>

      {/* SOURCES SECTION */}
      <div className="sources-section">
        <div className="sources-header">Sources</div>
        <div
          className="sources-row-link"
          onClick={() =>
            onOpenSourceInspector({
              cite: "[S1]",
              source: "SOP-07",
              text: "P-2104B inspection record. The pump showed increased vibration during operation. Inspection was scheduled for bearing and alignment checks.",
            })
          }
        >
          <span>All indexed sources</span>
          <span>›</span>
        </div>
      </div>

      {/* ADD DOCUMENT MODAL */}
      {showAddDocModal && (
        <div className="modal-overlay" onClick={() => setShowAddDocModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-sans">ADD TO KNOWLEDGE BASE</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAddDocModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIngestSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Document Name / Source</label>
                <input
                  type="text"
                  className="sidebar-search-input"
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  placeholder="e.g. SOP-07"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Document Text</label>
                <textarea
                  className="sidebar-search-input"
                  style={{ height: "90px", resize: "none" }}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste SOP or technical record content..."
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>Equipment Tags</label>
                <input
                  type="text"
                  className="sidebar-search-input"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. P-2104B"
                />
              </div>

              {ingestStage && (
                <div style={{ color: "#16a34a", fontSize: "12px", fontWeight: 600 }}>
                  {ingestStage}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddDocModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!ingestStage}
                  className="btn btn-primary"
                >
                  Ingest Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
