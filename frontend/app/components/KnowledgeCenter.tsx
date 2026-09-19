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

  const rawHits = searchResult?.hits || [];
  const uniqueHits = rawHits.filter((h: any, index: number, self: any[]) =>
    index === self.findIndex((t) => (t.text || "").trim() === (h.text || "").trim())
  );

  return (
    <aside className="left-panel">
      {/* KNOWLEDGE HEADER */}
      <h2 className="sidebar-title-main">Knowledge</h2>
      <div className="sidebar-subtitle-main">Documents & evidence</div>

      {/* ADD DOCUMENT BUTTON */}
      <button
        className="btn-add-doc"
        onClick={() => setShowAddDocModal(true)}
      >
        <span>+</span> Add Document
      </button>

      {/* SEARCH INPUT WITH CTRL+K */}
      <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
        <span className="search-icon-left">🔍</span>
        <input
          type="text"
          className="search-input-field"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge..."
        />
        <span className="search-ctrl-k">Ctrl K</span>
      </form>

      {/* DOCUMENTS SECTION */}
      <div style={{ marginBottom: "20px" }}>
        <div className="sidebar-section-label">
          <span>Documents ({documents.length})</span>
        </div>

        {documents.map((doc) => (
          <div key={doc.id} className="doc-card-exact">
            <div className="doc-icon-box">
              📄
            </div>
            <div className="doc-info-block">
              <div className="doc-name">{doc.source}</div>
              <div className="doc-sub">{doc.title}</div>
              <div className="doc-status-line">
                <span className="dot dot-green"></span> {doc.status}
              </div>
            </div>
            <div className="doc-dots-menu">⋮</div>
          </div>
        ))}
      </div>

      {/* SOURCES SECTION */}
      <div style={{ marginTop: "16px" }}>
        <div
          className="sources-row-label"
          onClick={() => {
            if (uniqueHits.length > 0) {
              onOpenSourceInspector(uniqueHits[0]);
            }
          }}
        >
          <span>Sources</span>
          <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>›</span>
        </div>
        <div className="sources-sub">All indexed sources</div>
      </div>

      {/* SEARCH EVIDENCE RESULTS (IF SEARCHED) */}
      {uniqueHits.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <div className="sidebar-section-label">
            <span>Retrieved Evidence ({uniqueHits.length})</span>
          </div>
          {uniqueHits.map((h: any, idx: number) => (
            <div
              key={idx}
              className="doc-card-exact"
              style={{ cursor: "pointer", flexDirection: "column", gap: "6px" }}
              onClick={() => onOpenSourceInspector(h)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "11px" }}>
                <span className="font-mono font-bold">[{h.cite || `S${idx + 1}`}] {h.source || "SOP-07"}</span>
                {h.tag_hit && <span className="doc-status-line">● Tag Match</span>}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{h.text ? h.text.slice(0, 60) + "..." : "P-2104B Inspection Record"}</div>
              <div style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: 600 }}>View source →</div>
            </div>
          ))}
        </div>
      )}

      {/* ADD DOCUMENT MODAL */}
      {showAddDocModal && (
        <div className="modal-overlay" onClick={() => setShowAddDocModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <span className="modal-icon">📄</span>
              <div>
                <h2 className="modal-title">ADD TO KNOWLEDGE BASE</h2>
                <div className="modal-subtitle">Upload and index document for sovereign RAG</div>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowAddDocModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIngestSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  Document Name / Source
                </label>
                <input
                  type="text"
                  className="search-input-field"
                  style={{ paddingLeft: "12px" }}
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  placeholder="e.g. SOP-07"
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  Document Content
                </label>
                <textarea
                  className="composer-textarea"
                  style={{ width: "100%", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px" }}
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste document content..."
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  Equipment Tags
                </label>
                <input
                  type="text"
                  className="search-input-field"
                  style={{ paddingLeft: "12px" }}
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. P-2104B"
                />
              </div>

              {ingestStage && (
                <div className="doc-status-line" style={{ fontSize: "12px", marginTop: "8px" }}>
                  {ingestStage}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="action-btn-white"
                  onClick={() => setShowAddDocModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!ingestStage}
                  className="action-btn-black"
                >
                  Ingest & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
