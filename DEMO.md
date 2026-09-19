# SIH26117 — 5-Minute Hackathon Demo Script

Follow this exact sequence to present the **Sovereign On-Premise Agentic AI Workbench** to hackathon judges.

---

### STEP A — Ingest Technical SOP Document (0:00 – 1:00)

1. Open the Workbench UI in your browser (`http://localhost:3000`).
2. On the **Left Panel (Document Ingest)**:
   - **Source:** `SOP-07`
   - **Text:**
     ```
     P-2104B inspection record.
     The pump showed increased vibration during operation.
     Inspection was scheduled for bearing and alignment checks.
     The equipment tag is P-2104B.
     ```
3. Click **INGEST DOCUMENT**.
4. Point out to judges:
   - The document is automatically chunked with `RecursiveCharacterTextSplitter`.
   - Embeddings are generated locally using `nomic-embed-text`.
   - Data is indexed in **MongoDB** (chunks), **Qdrant** (vectors), and **PostgreSQL** (audit ledger) with the same unified `doc_id`.

---

### STEP B — Sovereign Question Answering (1:00 – 2:00)

1. Click **Preset: Question (P-2104B)** or type:
   > *"What is the inspection status of P-2104B?"*
2. Click **RUN AGENT**.
3. Point out to judges on the **Agent Trace (Right Panel)**:
   - **Route Selector:** Auto-classified to `general` model.
   - **Tool Execution:** `kb_search` invoked directly in Python.
   - **Tag Reranking:** Exact equipment identifier `P-2104B` was recognized and promoted.
   - **Citation Pack:** The answer includes explicit citation markers `[S1] Source: SOP-07`.

---

### STEP C — Agent Task & Approval Gate (2:00 – 3:15)

1. Click **Preset: Report Request (P-2104B)** or type:
   > *"Prepare an investigation report for P-2104B."*
2. Click **RUN AGENT**.
3. Watch the **Right Panel Trace**:
   - High-level plan generated.
   - `kb_search` executed for findings.
   - **Human Approval Required** dialog pops up!
4. Explain to judges:
   - *"Our agent does NOT autonomously publish sensitive documents or execute unverified actions. It pauses at an approval gate and requests explicit operator consent."*

---

### STEP D — Human Approval & Deliverable Generation (3:15 – 4:15)

1. Click **[Approve Report Generation]** in the modal.
2. The backend verifies approval state, runs `make_docx`, and compiles `Sovereign_AI_Investigation_Report.docx`.
3. Click **[Download Report]** button.
4. Open the downloaded `.docx` file in Word/LibreOffice to show the professional 4-section report (Executive Summary, Findings, Evidence, Recommendations).

---

### STEP E — Sovereignty Proof & Audit Chain Verification (4:15 – 5:00)

1. Show the **Top Sovereignty Bar**:
   - `LOCAL SOVEREIGN: ON`
   - Allowed loopback connections counted.
   - External blocked attempts logged.
2. Click **RUN CANARY**:
   - Demonstrates that raw IP egress (`8.8.8.8:53`) and DNS egress (`google.com:443`) are intercepted and blocked at the socket level.
3. Show the **Bottom Status Bar**:
   - `Audit Chain: VALID (X events)`
   - Explain that all agent steps are secured by a SHA-256 tamper-evident hash chain.
