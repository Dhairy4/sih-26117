"use client";
// Step 3: router panel added (models + route tester). Same fetch+pre pattern.
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function Home() {
  const [live, setLive] = useState("loading…");
  const [ready, setReady] = useState("loading…");
  const [seal, setSeal] = useState("loading…");
  const [canary, setCanary] = useState("press RUN CANARY…");
  const [models, setModels] = useState("loading…");
  const [task, setTask] = useState("write a python function to parse pump CSV");
  const [routed, setRouted] = useState("press ROUTE…");
  const [src, setSrc] = useState("SOP-07-sample");
  const [doc, setDoc] = useState(
    "Inspection report 2026-08-14: pump P-2104B vibration 7.1 mm/s, limit 4.5 per SOP-07. Seal wear suspected."
  );
  const [ingested, setIngested] = useState("press INGEST…");
  const [q, setQ] = useState("P-2104B vibration findings");
  const [found, setFound] = useState("press SEARCH…");

  const loadSeal = () =>
    fetch(`${API}/sovereignty/status`)
      .then((r) => r.text())
      .then(setSeal)
      .catch((e) => setSeal("FAIL: " + e.message));

  useEffect(() => {
    fetch(`${API}/health`)
      .then((r) => r.text())
      .then(setLive)
      .catch((e) => setLive("FAIL: " + e.message));
    fetch(`${API}/health/db`)
      .then((r) => r.text())
      .then(setReady)
      .catch((e) => setReady("FAIL: " + e.message));
    fetch(`${API}/models`)
      .then((r) => r.text())
      .then(setModels)
      .catch((e) => setModels("FAIL: " + e.message));
    loadSeal();
    const t = setInterval(loadSeal, 5000);
    return () => clearInterval(t);
  }, []);

  const runCanary = () =>
    fetch(`${API}/sovereignty/canary`, { method: "POST" })
      .then((r) => r.text())
      .then((t) => {
        setCanary(t);
        loadSeal();
      })
      .catch((e) => setCanary("FAIL: " + e.message));

  const runRoute = () =>
    fetch(`${API}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: task }),
    })
      .then((r) => r.text())
      .then(setRouted)
      .catch((e) => setRouted("FAIL: " + e.message));

  const runIngest = () =>
    fetch(`${API}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: src, text: doc }),
    })
      .then((r) => r.text())
      .then(setIngested)
      .catch((e) => setIngested("FAIL: " + e.message));

  const runSearch = () =>
    fetch(`${API}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, k: 4 }),
    })
      .then((r) => r.text())
      .then(setFound)
      .catch((e) => setFound("FAIL: " + e.message));

  return (
    <main>
      <h1>Sovereign Workbench — Step 4</h1>
      <p>API: {API}</p>
      <h2>Liveness (/health)</h2>
      <pre>{live}</pre>
      <h2>Readiness (/health/db)</h2>
      <pre>{ready}</pre>
      <h2>Models (/models)</h2>
      <pre>{models}</pre>
      <h2>Route tester (POST /route)</h2>
      <input
        value={task}
        onChange={(e) => setTask(e.target.value)}
        style={{ width: "80%" }}
      />
      <button onClick={runRoute}>ROUTE</button>
      <pre>{routed}</pre>
      <h2>Ingest (POST /ingest)</h2>
      <input
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        placeholder="source e.g. SOP-07"
      />
      <br />
      <textarea
        value={doc}
        onChange={(e) => setDoc(e.target.value)}
        rows={4}
        style={{ width: "80%" }}
      />
      <br />
      <button onClick={runIngest}>INGEST</button>
      <pre>{ingested}</pre>
      <h2>Search (POST /search)</h2>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ width: "80%" }}
      />
      <button onClick={runSearch}>SEARCH</button>
      <pre>{found}</pre>
      <h2>Seal (/sovereignty/status, 5s poll)</h2>
      <pre>{seal}</pre>
      <h2>Canary (POST /sovereignty/canary)</h2>
      <button onClick={runCanary}>RUN CANARY</button>
      <pre>{canary}</pre>
    </main>
  );
}
