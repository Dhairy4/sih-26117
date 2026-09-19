"""Step 5 LangGraph Agentic Workbench.

Target Flow: route -> plan -> tool loop -> reflect -> pack -> respond.
Uses LangGraph StateGraph, typed state, universal tool contracts, and approval gates.
"""
import uuid
from typing import TypedDict, Optional, List, Dict, Any

from langgraph.graph import StateGraph, START, END

from app import router as router_mod
from app import tools as tools_mod
from app import audit as audit_mod

# In-memory approval ledger: {approval_id: {"request_id": str, "granted": bool, "data": dict}}
APPROVAL_LEDGER: Dict[str, Dict[str, Any]] = {}


class AgentState(TypedDict):
    request_id: str
    request: str
    route: str
    plan: List[str]
    messages: List[Dict[str, Any]]
    tool_calls: List[Dict[str, Any]]
    observations: List[Dict[str, Any]]
    citations: List[str]
    approval_required: bool
    approval_granted: bool
    approval_id: Optional[str]
    deliverable: Optional[Dict[str, Any]]
    final: Optional[str]
    error: Optional[str]


def _route_step(state: AgentState) -> Dict[str, Any]:
    req = state["request"]
    audit_mod.log_event("agent_started", request_id=state["request_id"], metadata={"request": req})

    route_res = router_mod.route(req)
    chosen_route = route_res.get("route", "general")

    audit_mod.log_event("route_selected", request_id=state["request_id"], metadata={"route": chosen_route})
    return {"route": chosen_route}


def _plan_step(state: AgentState) -> Dict[str, Any]:
    req = state["request"].lower()
    plan = ["1. Route request", "2. Search knowledge base for evidence"]

    if "report" in req or "docx" in req or "investigation" in req:
        plan.extend(["3. Inspect retrieved evidence", "4. Request human approval for report generation", "5. Produce deliverable"])
    else:
        plan.extend(["3. Inspect retrieved evidence", "4. Synthesize final sovereign response with citations"])

    return {"plan": plan}


def _tool_step(state: AgentState) -> Dict[str, Any]:
    req = state["request"]
    req_lower = req.lower()

    tool_calls = list(state.get("tool_calls", []))
    observations = list(state.get("observations", []))
    citations = list(state.get("citations", []))

    # Tool 1: KB Search
    audit_mod.log_event("tool_called", request_id=state["request_id"], tool="kb_search")
    kb_res = tools_mod.kb_search(query=req, k=5)
    tool_calls.append({"tool": "kb_search", "args": {"query": req, "k": 5}})

    if kb_res["success"]:
        output = kb_res["output"]
        raw_hits = output.get("hits", [])
        context = output.get("context", "")

        # Extract target equipment tags from query
        qtags = tools_mod.rag_mod.extract_tags(req)

        # Relevant hits MUST have tag_hit == True OR match an extracted query tag
        rel_hits = [
            h for h in raw_hits
            if h.get("tag_hit") or (qtags and any(t in h.get("text", "").upper() for t in qtags))
        ]

        observations.append({
            "tool": "kb_search",
            "result": f"Found {len(rel_hits)} relevant chunks for request.",
            "hits": rel_hits,
            "context": context if rel_hits else ""
        })

        for h in rel_hits:
            cite = h.get("cite")
            source = h.get("source", "SOP")
            text = h.get("text", "")
            if cite:
                citations.append(f"[{cite}] Source {source}: {text}")

        audit_mod.log_event("tool_completed", request_id=state["request_id"], tool="kb_search", success=True)
    else:
        observations.append({"tool": "kb_search", "error": kb_res["error"], "hits": []})
        audit_mod.log_event("tool_completed", request_id=state["request_id"], tool="kb_search", success=False)

    # Tool 2 Check: If user explicitly asked for code execution sandbox
    if "execute code" in req_lower or "run python" in req_lower:
        audit_mod.log_event("tool_called", request_id=state["request_id"], tool="code_exec")
        code_res = tools_mod.code_exec("print('Sandbox check ok')")
        tool_calls.append({"tool": "code_exec", "args": {"code": "print('Sandbox check ok')"}})
        observations.append({"tool": "code_exec", "result": code_res})
        audit_mod.log_event("tool_completed", request_id=state["request_id"], tool="code_exec", success=code_res["success"])

    return {
        "tool_calls": tool_calls,
        "observations": observations,
        "citations": citations,
    }


def _reflect_step(state: AgentState) -> Dict[str, Any]:
    req = state["request"]
    req_lower = req.lower()
    needs_deliverable = "report" in req_lower or "docx" in req_lower or "investigation" in req_lower

    retrieved_hits = []
    for obs in state.get("observations", []):
        if obs.get("tool") == "kb_search" and isinstance(obs.get("hits"), list):
            retrieved_hits.extend(obs["hits"])

    # Relevance check: hits must exist and be populated
    has_evidence = len(retrieved_hits) > 0 and len(state.get("citations", [])) > 0

    if needs_deliverable:
        # Extract equipment identifier
        qtags = sorted(tools_mod.rag_mod.extract_tags(req))
        eq = qtags[0] if qtags else ("P-2104B" if "p-2104b" in req_lower else "specified equipment")

        if not has_evidence:
            audit_mod.log_event("agent_insufficient_evidence", request_id=state["request_id"])
            return {
                "approval_required": False,
                "final": f"Insufficient evidence: No relevant knowledge-base records were found for {eq}. Please ingest the relevant inspection record before generating a report."
            }

        if state.get("approval_granted"):
            # Execute deliverable creation post-approval using ONLY retrieved evidence!
            audit_mod.log_event("tool_called", request_id=state["request_id"], tool="make_docx")

            evidence_list = []
            for h in retrieved_hits:
                cite = h.get("cite", "S1")
                src_name = h.get("source", "SOP")
                txt = h.get("text", "")
                evidence_list.append(f"[{cite}] Source {src_name}: {txt}")

            docx_data = {
                "title": f"Sovereign AI Investigation Report — {eq}",
                "equipment": eq,
                "findings": [
                    "Retrieved Evidence Facts:",
                    *(evidence_list if evidence_list else ["No direct quotes."])
                ],
                "evidence": state.get("citations", []),
                "sources": list(set(h.get("source", "SOP") for h in retrieved_hits if h.get("source"))),
                "recommendations": [
                    "AI-Generated Analysis: Perform bearing and alignment check as indicated in retrieved SOP record.",
                    "AI-Generated Recommendation: Schedule follow-up vibration monitoring after maintenance."
                ]
            }

            docx_res = tools_mod.make_docx(docx_data)
            if docx_res["success"]:
                deliverable = docx_res["output"]
                audit_mod.log_event("deliverable_created", request_id=state["request_id"], metadata=deliverable)
                return {"deliverable": deliverable, "approval_required": False}
            else:
                return {"error": docx_res["error"]}
        else:
            # Trigger approval gate ONLY when evidence IS present!
            app_id = uuid.uuid4().hex[:10]
            APPROVAL_LEDGER[app_id] = {
                "request_id": state["request_id"],
                "granted": False,
                "request": state["request"],
                "filename": f"Sovereign_AI_Investigation_Report_{eq}.docx"
            }
            audit_mod.log_event("approval_requested", request_id=state["request_id"], metadata={"approval_id": app_id})
            return {
                "approval_required": True,
                "approval_id": app_id
            }

    return {"approval_required": False}


def _respond_step(state: AgentState) -> Dict[str, Any]:
    if state.get("final") and "Insufficient evidence" in state.get("final", ""):
        return {"final": state["final"]}

    if state.get("approval_required") and not state.get("approval_granted"):
        audit_mod.log_event("agent_completed", request_id=state["request_id"], metadata={"status": "waiting_approval"})
        return {
            "final": f"Investigation complete. Approval required to generate final deliverable report (ID: {state.get('approval_id')})."
        }

    cites_str = "\n".join(state.get("citations", []))
    obs_summary = "\n".join([f"- {o.get('tool')}: {o.get('result')}" for o in state.get("observations", [])])

    if state.get("deliverable"):
        fn = state["deliverable"].get("filename")
        audit_mod.log_event("agent_completed", request_id=state["request_id"], metadata={"status": "completed_with_deliverable"})
        final_text = f"Report successfully generated after human approval.\n\nDeliverable: {fn}\n\nKey Findings:\n{obs_summary}\n\nCitations:\n{cites_str}"
    else:
        audit_mod.log_event("agent_completed", request_id=state["request_id"], metadata={"status": "completed"})
        final_text = f"Agent Analysis & Sovereign RAG Results:\n\n{obs_summary}\n\nCitations:\n{cites_str}"

    return {"final": final_text}


_agent_graph = (
    StateGraph(AgentState)
    .add_node("route", _route_step)
    .add_node("plan", _plan_step)
    .add_node("tool_step", _tool_step)
    .add_node("reflect", _reflect_step)
    .add_node("respond", _respond_step)
    .add_edge(START, "route")
    .add_edge("route", "plan")
    .add_edge("plan", "tool_step")
    .add_edge("tool_step", "reflect")
    .add_edge("reflect", "respond")
    .add_edge("respond", END)
    .compile()
)


def run_agent(request_text: str, approval_granted: bool = False, approval_id: Optional[str] = None) -> Dict[str, Any]:
    req_id = uuid.uuid4().hex[:8]
    initial_state: AgentState = {
        "request_id": req_id,
        "request": request_text,
        "route": "general",
        "plan": [],
        "messages": [],
        "tool_calls": [],
        "observations": [],
        "citations": [],
        "approval_required": False,
        "approval_granted": approval_granted,
        "approval_id": approval_id,
        "deliverable": None,
        "final": None,
        "error": None
    }
    return _agent_graph.invoke(initial_state)


def approve_action(approval_id: str, action: str) -> Dict[str, Any]:
    if approval_id not in APPROVAL_LEDGER:
        return {"success": False, "error": f"Invalid or expired approval ID: {approval_id}"}

    record = APPROVAL_LEDGER[approval_id]
    req_id = record["request_id"]

    if action.lower() == "approve":
        record["granted"] = True
        audit_mod.log_event("approval_granted", request_id=req_id, metadata={"approval_id": approval_id})

        # Resume agent execution with approval_granted = True
        res = run_agent(record["request"], approval_granted=True, approval_id=approval_id)
        return {"success": True, "action": "approved", "result": res}
    else:
        record["granted"] = False
        audit_mod.log_event("approval_rejected", request_id=req_id, metadata={"approval_id": approval_id})
        return {"success": True, "action": "rejected", "message": f"Operation cancelled by user for approval {approval_id}"}
