"use client";

import { useState } from "react";

interface AgentConsoleProps {
  prompt: string;
  setPrompt: (p: string) => void;
  onRunAgent: () => void;
  isRunning: boolean;
  agentFinal: string;
  agentSteps: any[];
  deliverableFilename: string;
  apiBase: string;
  onOpenSourceInspector: (sourceItem: any) => void;
  onOpenExecutionDetails: () => void;
}

export default function AgentConsole({
  prompt,
  setPrompt,
  onRunAgent,
  isRunning,
  agentFinal,
  agentSteps,
  deliverableFilename,
  apiBase,
  onOpenSourceInspector,
  onOpenExecutionDetails,
}: AgentConsoleProps) {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showKnowledgeMenu, setShowKnowledgeMenu] = useState(false);

  const availableTools = [
    "Knowledge Search",
    "Code Execution",
    "File Read",
    "File Write",
    "OCR / Vision",
    "Generate DOCX",
  ];

  const availableKnowledge = [
    "All Knowledge",
    "SOP-07 (P-2104B Inspection)",
  ];

  return (
    <main className="panel-container center-panel font-sans">
      {/* AGENT HEADER BAR */}
      <div className="agent-header-bar">
        <div>
          <div className="agent-category-tag">AI AGENT</div>
          <h2 className="agent-title-text">Sovereign Agent</h2>
          <div className="agent-subtitle-text">
            Local reasoning • Tool enabled • Evidence grounded
          </div>
        </div>
        <div className="header-status-pill">
          <span className="dot dot-green"></span> OLLAMA LOCAL
        </div>
      </div>

      {/* QUICK ACTIONS ROW (EXACTLY 3) */}
      <div className="quick-actions-row">
        <button
          type="button"
          className="btn-action-primary"
          onClick={() => {
            setPrompt("What is the inspection status of P-2104B?");
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Investigate Equipment
        </button>

        <button
          type="button"
          className="btn-action-secondary"
          onClick={() => {
            setPrompt("Search knowledge base for vibration findings.");
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Search Knowledge
        </button>

        <button
          type="button"
          className="btn-action-secondary"
          onClick={() => {
            setPrompt("Prepare an investigation report for P-2104B.");
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Generate Report
        </button>
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div className="chat-scroll-area">
        {/* USER PROMPT BUBBLE */}
        <div className="user-msg-container">
          <div className="user-msg-bubble-col">
            <div className="user-msg-bubble font-sans">
              Prepare an investigation report for P-2104B.
            </div>
            <div className="user-msg-time">10:42 AM</div>
          </div>
          <div className="user-avatar-circle">D</div>
        </div>

        {/* AGENT RESPONSE BLOCK */}
        <div className="agent-response-row">
          <div className="agent-avatar-circle">🤖</div>
          <div className="agent-msg-body">
            <p className="agent-intro-text font-sans">
              I'll search the local knowledge base for relevant information about P-2104B.
            </p>

            {/* EVIDENCE FOUND CARD (EXACT MINT GREEN MATCH) */}
            <div className="evidence-card-mint">
              <div className="evidence-header-row">
                <div className="evidence-title-flex font-sans">
                  <div className="evidence-check-circle">✓</div>
                  <span>Evidence found</span>
                </div>
                <span className="evidence-badge-tag font-mono">[S1]</span>
              </div>

              <div className="evidence-inner-doc-box">
                <div className="evidence-doc-left">
                  <div className="evidence-doc-icon-sq">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="evidence-doc-texts font-sans">
                    <span className="evidence-doc-title">SOP-07</span>
                    <span className="evidence-doc-sub">P-2104B Inspection Record</span>
                    <span className="evidence-doc-match">Exact equipment tag match</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-view-source font-sans"
                  onClick={() =>
                    onOpenSourceInspector({
                      cite: "[S1]",
                      source: "SOP-07",
                      text: "P-2104B inspection record.\nThe pump showed increased vibration during operation.\nInspection was scheduled for bearing and alignment checks.\nThe equipment tag is P-2104B.",
                    })
                  }
                >
                  View source →
                </button>
              </div>
            </div>

            {/* AGENT DETAILED ANALYSIS TEXT */}
            <p className="agent-analysis-paragraph font-sans">
              The retrieved record indicates that P-2104B showed increased vibration during operation. Inspection was scheduled for bearing and alignment checks. The equipment tag is P-2104B.
            </p>

            <p className="agent-next-prompt font-sans">
              Would you like me to prepare the full investigation report based on this evidence?
            </p>

            {/* ACTION BUTTONS & REPORT CREATED STATE */}
            <div className="agent-actions-footer">
              <button
                type="button"
                className="btn-action-primary font-sans"
                onClick={onRunAgent}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Review & Generate Report
              </button>

              <button
                type="button"
                className="btn-action-secondary font-sans"
                onClick={onOpenExecutionDetails}
              >
                Show execution details ▾
              </button>
            </div>

            {/* SUCCESS BANNER IF REPORT GENERATED */}
            {deliverableFilename && (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "8px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#16a34a", fontWeight: "bold" }}>✓ Report ready:</span>
                  <span style={{ fontWeight: 600, color: "#166534" }}>{deliverableFilename}</span>
                </div>
                <a
                  href={`${apiBase}/deliverables/${deliverableFilename}`}
                  target="_blank"
                  download
                  className="btn btn-primary"
                  style={{ textDecoration: "none", fontSize: "11px", padding: "6px 12px" }}
                >
                  Download Report (.DOCX)
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHAT INPUT COMPOSER (BOTTOM OF WORKSPACE) */}
      <div className="chat-composer-box">
        <div className="composer-card">
          <div className="composer-top-row">
            <button type="button" className="composer-attach-btn" title="Attach file">
              📎
            </button>
            <textarea
              className="composer-textarea"
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isRunning && prompt.trim()) {
                    onRunAgent();
                  }
                }
              }}
              placeholder="Ask anything about your documents, equipment, or investigation..."
            />
          </div>

          <div className="composer-bottom-row">
            <div className="composer-tools-left">
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="btn-composer-tool"
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                >
                  🛠 Tools ▾
                </button>
                {showToolsMenu && (
                  <div style={{ position: "absolute", bottom: "32px", left: 0, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 0", minWidth: "160px", zIndex: 100 }}>
                    {availableTools.map((t, idx) => (
                      <div key={idx} style={{ padding: "6px 12px", fontSize: "11px", color: "#334155", cursor: "pointer" }} onClick={() => setShowToolsMenu(false)}>
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="btn-composer-tool"
                  onClick={() => setShowKnowledgeMenu(!showKnowledgeMenu)}
                >
                  📚 Knowledge ▾
                </button>
                {showKnowledgeMenu && (
                  <div style={{ position: "absolute", bottom: "32px", left: 0, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 0", minWidth: "180px", zIndex: 100 }}>
                    {availableKnowledge.map((k, idx) => (
                      <div key={idx} style={{ padding: "6px 12px", fontSize: "11px", color: "#334155", cursor: "pointer" }} onClick={() => setShowKnowledgeMenu(false)}>
                        {k}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn-send-square"
              onClick={onRunAgent}
              disabled={isRunning || !prompt.trim()}
              title="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
