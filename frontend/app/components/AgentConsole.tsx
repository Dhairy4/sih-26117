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
  const [selectedToolMenu, setSelectedToolMenu] = useState(false);
  const [selectedKnowledgeMenu, setSelectedKnowledgeMenu] = useState(false);
  const isInsufficient = agentFinal.toLowerCase().includes("insufficient evidence");

  return (
    <main className="panel-container center-panel">
      <div className="agent-workspace-container">
        {/* WORKSPACE HEADER ROW */}
        <div className="workspace-header-row">
          <div>
            <div className="ai-agent-label">AI AGENT</div>
            <h1 className="sovereign-agent-title">Sovereign Agent</h1>
            <div className="sovereign-agent-sub">
              Local reasoning • Tool enabled • Evidence grounded
            </div>
          </div>
          <div className="ollama-status-badge font-mono">
            <span className="dot dot-green"></span> OLLAMA LOCAL
          </div>
        </div>

        {/* QUICK ACTIONS ROW (3 PILL BUTTONS) */}
        <div className="quick-actions-row">
          <button
            type="button"
            className="action-btn-black"
            onClick={() => setPrompt("Investigate Equipment P-2104B")}
          >
            <span>🔍</span> Investigate Equipment
          </button>
          <button
            type="button"
            className="action-btn-white"
            onClick={() => setPrompt("Search knowledge base for vibration findings.")}
          >
            <span>📄</span> Search Knowledge
          </button>
          <button
            type="button"
            className="action-btn-white"
            onClick={() => setPrompt("Prepare an investigation report for P-2104B.")}
          >
            <span>📄</span> Generate Report
          </button>
        </div>

        {/* CHAT CONVERSATION STREAM */}
        <div className="chat-stream-box">
          {/* USER MESSAGE (RIGHT ALIGNED) */}
          <div className="user-msg-block">
            <div className="user-bubble-wrap">
              <div className="user-bubble-exact">
                Prepare an investigation report for P-2104B.
              </div>
              <div className="user-avatar-circle">
                D
              </div>
            </div>
            <div className="msg-timestamp">10:42 AM</div>
          </div>

          {/* AGENT RUNNING STATE */}
          {isRunning && (
            <div className="agent-msg-block">
              <div className="robot-avatar-icon">🤖</div>
              <div className="agent-msg-content" style={{ color: "var(--text-muted)" }}>
                <span className="dot dot-green" style={{ animation: "pulse 1.5s infinite" }}></span> Local agent reasoning and searching knowledge base...
              </div>
            </div>
          )}

          {/* AGENT RESPONSE STREAM (EXACT PIXEL-PERFECT MATCH) */}
          {(!isRunning || agentFinal) && (
            <div className="agent-msg-block">
              <div className="robot-avatar-icon">🤖</div>
              <div className="agent-msg-content">
                {isInsufficient ? (
                  <div style={{ padding: "16px", background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: "8px", color: "#6B21A8" }}>
                    <div className="font-mono font-bold" style={{ fontSize: "12px", marginBottom: "4px" }}>
                      ⚠ INSUFFICIENT EVIDENCE
                    </div>
                    <div>{agentFinal}</div>
                  </div>
                ) : (
                  <>
                    <p className="agent-intro-p">
                      I'll search the local knowledge base for relevant information about P-2104B.
                    </p>

                    {/* MINT GREEN EVIDENCE CARD */}
                    <div className="evidence-card-mint">
                      <div className="evidence-mint-header">
                        <div className="evidence-mint-title">
                          <span style={{ fontSize: "15px" }}>✔</span> Evidence found
                        </div>
                        <div className="evidence-cite-tag">[S1]</div>
                      </div>

                      <div className="evidence-inner-card">
                        <div className="evidence-inner-left">
                          <div className="ev-doc-icon">📄</div>
                          <div>
                            <div className="ev-doc-name">SOP-07</div>
                            <div className="ev-doc-sub">P-2104B Inspection Record</div>
                            <div className="ev-doc-match">Exact equipment tag match</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-view-source"
                          onClick={() =>
                            onOpenSourceInspector({
                              cite: "[S1]",
                              source: "SOP-07",
                              text:
                                "P-2104B inspection record. The pump showed increased vibration during operation. Inspection was scheduled for bearing and alignment checks.",
                            })
                          }
                        >
                          View source →
                        </button>
                      </div>
                    </div>

                    {/* AGENT ANALYSIS PARAGRAPHS */}
                    <p className="agent-paragraph">
                      The retrieved record indicates that P-2104B showed increased vibration during operation. Inspection was scheduled for bearing and alignment checks. The equipment tag is P-2104B.
                    </p>

                    <p className="next-action-prompt">
                      Would you like me to prepare the full investigation report based on this evidence?
                    </p>

                    {/* ACTION BUTTONS GROUP */}
                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="action-btn-black"
                        onClick={onRunAgent}
                      >
                        <span>📄</span> Review & Generate Report
                      </button>
                      <button
                        type="button"
                        className="action-btn-white"
                        onClick={onOpenExecutionDetails}
                      >
                        <span>📄</span> Show execution details ▾
                      </button>
                    </div>

                    {/* REPORT READY SUCCESS BANNER */}
                    {deliverableFilename && (
                      <div className="compact-report-banner" style={{ marginTop: "20px" }}>
                        <div className="banner-top">
                          <div>
                            <span className="text-green font-bold">✓ Report ready</span>
                            <div className="font-mono text-dim" style={{ fontSize: "12px", marginTop: "2px" }}>
                              {deliverableFilename}
                            </div>
                          </div>
                          <a
                            href={`${apiBase}/deliverables/${deliverableFilename}`}
                            target="_blank"
                            download
                            className="action-btn-black"
                            style={{ textDecoration: "none" }}
                          >
                            Download Report (.DOCX)
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CHAT COMPOSER (EXACT MATCH) */}
        <div className="composer-card-exact">
          <div className="composer-input-row">
            <span className="clip-icon">📎</span>
            <textarea
              className="composer-textarea"
              rows={2}
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

          <div className="composer-tools-row">
            <div className="composer-left-tools">
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="composer-pill-btn"
                  onClick={() => setSelectedToolMenu(!selectedToolMenu)}
                >
                  <span>🛠</span> Tools ▾
                </button>
                {selectedToolMenu && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "32px",
                      left: 0,
                      background: "#ffffff",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      padding: "8px",
                      boxShadow: "var(--shadow-modal)",
                      zIndex: 50,
                      width: "180px",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ padding: "4px 8px", fontWeight: 600, color: "var(--text-muted)", fontSize: "10px" }}>
                      AVAILABLE TOOLS
                    </div>
                    <div style={{ padding: "4px 8px" }}>Knowledge Search</div>
                    <div style={{ padding: "4px 8px" }}>File Read / Write</div>
                    <div style={{ padding: "4px 8px" }}>Generate DOCX</div>
                  </div>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="composer-pill-btn"
                  onClick={() => setSelectedKnowledgeMenu(!selectedKnowledgeMenu)}
                >
                  <span>📚</span> Knowledge ▾
                </button>
                {selectedKnowledgeMenu && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "32px",
                      left: 0,
                      background: "#ffffff",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      padding: "8px",
                      boxShadow: "var(--shadow-modal)",
                      zIndex: 50,
                      width: "180px",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ padding: "4px 8px", fontWeight: 600, color: "var(--text-muted)", fontSize: "10px" }}>
                      KNOWLEDGE BASES
                    </div>
                    <div style={{ padding: "4px 8px" }}>All Knowledge</div>
                    <div style={{ padding: "4px 8px" }}>SOP-07 Inspection</div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onRunAgent}
              disabled={isRunning || !prompt.trim()}
              className="composer-send-square"
              title="Send Message"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
