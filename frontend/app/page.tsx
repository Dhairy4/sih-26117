"use client";

import { useEffect, useState } from "react";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import SystemBar from "./components/SystemBar";
import KnowledgeCenter from "./components/KnowledgeCenter";
import AgentConsole from "./components/AgentConsole";
import ApprovalModal from "./components/ApprovalModal";
import SovereigntyPanel from "./components/SovereigntyPanel";
import ModelsPanel from "./components/ModelsPanel";
import AuditModal from "./components/AuditModal";
import SystemStatusModal from "./components/SystemStatusModal";
import SourceInspectorModal from "./components/SourceInspectorModal";
import ExecutionDetailsModal from "./components/ExecutionDetailsModal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function Home() {
  // System State
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [sealStatus, setSealStatus] = useState<any>(null);
  const [auditStatus, setAuditStatus] = useState<any>(null);
  const [modelsStatus, setModelsStatus] = useState<any>(null);
  const [canaryResult, setCanaryResult] = useState<any>(null);

  // UI Navigation & Modal / Drawer State
  const [showSovereigntyModal, setShowSovereigntyModal] = useState(false);
  const [showModelsModal, setShowModelsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showSystemStatusModal, setShowSystemStatusModal] = useState(false);
  const [showSourceInspector, setShowSourceInspector] = useState(false);
  const [selectedSourceItem, setSelectedSourceItem] = useState<any>(null);
  const [showExecutionDetailsModal, setShowExecutionDetailsModal] = useState(false);
  const [isRunningCanary, setIsRunningCanary] = useState(false);

  // RAG Search State
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Agent State
  const [agentPrompt, setAgentPrompt] = useState("Prepare an investigation report for P-2104B.");
  const [agentRoute, setAgentRoute] = useState<string>("");
  const [agentPlan, setAgentPlan] = useState<string[]>([]);
  const [agentSteps, setAgentSteps] = useState<any[]>([]);
  const [agentFinal, setAgentFinal] = useState<string>("");
  const [approvalRequired, setApprovalRequired] = useState<boolean>(false);
  const [approvalId, setApprovalId] = useState<string>("");
  const [approvalGranted, setApprovalGranted] = useState<boolean>(false);
  const [deliverableFilename, setDeliverableFilename] = useState<string>("");
  const [isRunningAgent, setIsRunningAgent] = useState<boolean>(false);

  const loadSeal = () =>
    fetch(`${API}/sovereignty/status`)
      .then((r) => r.json())
      .then(setSealStatus)
      .catch((e) => setSealStatus({ error: e.message }));

  const loadAudit = () =>
    fetch(`${API}/audit/verify`)
      .then((r) => r.json())
      .then(setAuditStatus)
      .catch((e) => setAuditStatus({ valid: false, error: e.message }));

  const loadDbHealth = () =>
    fetch(`${API}/health/db`)
      .then((r) => r.json())
      .then(setDbHealth)
      .catch((e) => setDbHealth({ error: e.message }));

  const loadModels = () =>
    fetch(`${API}/models`)
      .then((r) => r.json())
      .then(setModelsStatus)
      .catch((e) => setModelsStatus({ error: e.message }));

  useEffect(() => {
    loadDbHealth();
    loadSeal();
    loadAudit();
    loadModels();

    const timer = setInterval(() => {
      loadSeal();
      loadDbHealth();
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const runCanary = async () => {
    setIsRunningCanary(true);
    try {
      const res = await fetch(`${API}/sovereignty/canary`, { method: "POST" });
      const data = await res.json();
      setCanaryResult(data);
      loadSeal();
    } catch (e: any) {
      setCanaryResult({ error: e.message });
    } finally {
      setIsRunningCanary(false);
    }
  };

  const handleIngest = async (source: string, text: string, tags: string[]) => {
    try {
      const res = await fetch(`${API}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, text, tags }),
      });
      const data = await res.json();
      loadAudit();
      return data;
    } catch (e: any) {
      throw e;
    }
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`${API}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, k: 4 }),
      });
      const data = await res.json();
      setSearchResult(data);
      return data;
    } catch (e: any) {
      setSearchResult({ error: e.message });
    } finally {
      setIsSearching(false);
    }
  };

  const runAgent = async () => {
    const cleanPrompt = agentPrompt.trim();
    if (!cleanPrompt || isRunningAgent) return;

    setIsRunningAgent(true);
    setAgentRoute("");
    setAgentPlan([]);
    setAgentSteps([]);
    setAgentFinal("");
    setApprovalRequired(false);
    setApprovalId("");
    setApprovalGranted(false);
    setDeliverableFilename("");

    try {
      const response = await fetch(`${API}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanPrompt }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          if (!block.trim()) continue;
          const eventMatch = block.match(/event:\s*(.+)/);
          const dataMatch = block.match(/data:\s*(.+)/);

          if (eventMatch && dataMatch) {
            const eventName = eventMatch[1].trim();
            const dataObj = JSON.parse(dataMatch[1].trim());

            if (eventName === "route") {
              setAgentRoute(dataObj.route);
            } else if (eventName === "plan") {
              setAgentPlan(dataObj.plan);
            } else if (eventName === "tool_call" || eventName === "observation") {
              setAgentSteps((prev) => [
                ...prev,
                { type: eventName, data: dataObj, timestamp: new Date().toLocaleTimeString() },
              ]);
            } else if (eventName === "approval_required") {
              setApprovalRequired(true);
              setApprovalId(dataObj.approval_id);
            } else if (eventName === "final") {
              setAgentFinal(dataObj.final || "");
              if (dataObj.deliverable) {
                setDeliverableFilename(dataObj.deliverable.filename);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setAgentFinal("Agent Execution Error: " + err.message);
    } finally {
      setIsRunningAgent(false);
      loadAudit();
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`${API}/agent/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval_id: approvalId, action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        setApprovalGranted(true);
        setApprovalRequired(false);
        const finalResult = data.result?.final || "Report created successfully.";
        setAgentFinal(finalResult);
        if (data.result?.deliverable) {
          setDeliverableFilename(data.result.deliverable.filename);
        }
      }
    } catch (e: any) {
      alert("Approval Error: " + e.message);
    } finally {
      loadAudit();
    }
  };

  const handleReject = async () => {
    try {
      await fetch(`${API}/agent/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval_id: approvalId, action: "reject" }),
      });
      setApprovalRequired(false);
      setApprovalGranted(false);
      setAgentFinal("Deliverable generation cancelled by human operator.");
    } catch (e: any) {
      alert("Rejection Error: " + e.message);
    } finally {
      loadAudit();
    }
  };

  const openSourceInspector = (item: any) => {
    setSelectedSourceItem(item);
    setShowSourceInspector(true);
  };

  return (
    <div className="app-shell">
      {/* TOP HEADER */}
      <Header
        sealStatus={sealStatus}
        onOpenSovereignty={() => setShowSovereigntyModal(true)}
        onOpenModels={() => setShowModelsModal(true)}
      />

      {/* CLEAN 2-COLUMN WORKSPACE GRID (320px LEFT | REMAINING CENTER) */}

      {/* CLEAN 2-COLUMN WORKSPACE GRID (320px LEFT | REMAINING CENTER) */}
      <div className="workbench-two-col-grid">
        {/* LEFT SIDEBAR: KNOWLEDGE (~320px) */}
        <KnowledgeCenter
          onIngest={handleIngest}
          onSearch={handleSearch}
          searchResult={searchResult}
          isSearching={isSearching}
          onOpenSourceInspector={openSourceInspector}
        />

        {/* CENTER MAIN WORKSPACE: SOVEREIGN AGENT (REMAINING WIDTH) */}
        <AgentConsole
          prompt={agentPrompt}
          setPrompt={setAgentPrompt}
          onRunAgent={runAgent}
          isRunning={isRunningAgent}
          agentFinal={agentFinal}
          agentSteps={agentSteps}
          deliverableFilename={deliverableFilename}
          apiBase={API}
          onOpenSourceInspector={openSourceInspector}
          onOpenExecutionDetails={() => setShowExecutionDetailsModal(true)}
        />
      </div>

      {/* COMPACT BOTTOM SYSTEM BAR */}
      <SystemBar
        dbHealth={dbHealth}
        sealStatus={sealStatus}
        auditStatus={auditStatus}
        modelsStatus={modelsStatus}
      />

      {/* HUMAN APPROVAL MODAL */}
      {approvalRequired && (
        <ApprovalModal
          approvalId={approvalId}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={handleReject}
        />
      )}

      {/* SOVEREIGNTY DRAWER MODAL */}
      {showSovereigntyModal && (
        <SovereigntyPanel
          sealStatus={sealStatus}
          canaryResult={canaryResult}
          onClose={() => setShowSovereigntyModal(false)}
          onRunCanary={runCanary}
          isRunningCanary={isRunningCanary}
        />
      )}

      {/* MODELS DRAWER MODAL */}
      {showModelsModal && (
        <ModelsPanel
          modelsData={modelsStatus}
          onClose={() => setShowModelsModal(false)}
        />
      )}

      {/* AUDIT LOGS MODAL */}
      {showAuditModal && (
        <AuditModal
          auditData={auditStatus}
          onClose={() => setShowAuditModal(false)}
          onRefresh={loadAudit}
        />
      )}

      {/* SYSTEM STATUS MODAL */}
      {showSystemStatusModal && (
        <SystemStatusModal
          dbHealth={dbHealth}
          sealStatus={sealStatus}
          auditStatus={auditStatus}
          modelsStatus={modelsStatus}
          onClose={() => setShowSystemStatusModal(false)}
          onRefresh={loadDbHealth}
        />
      )}

      {/* SOURCE INSPECTOR MODAL */}
      {showSourceInspector && (
        <SourceInspectorModal
          sourceData={selectedSourceItem}
          onClose={() => setShowSourceInspector(false)}
        />
      )}

      {/* EXECUTION DETAILS MODAL */}
      {showExecutionDetailsModal && (
        <ExecutionDetailsModal
          route={agentRoute}
          plan={agentPlan}
          steps={agentSteps}
          deliverable={deliverableFilename}
          onClose={() => setShowExecutionDetailsModal(false)}
        />
      )}
    </div>
  );
}
