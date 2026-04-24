import React, { useState, useCallback } from "react";
import "./index.css";
import { TreeVisualizer } from "./TreeVisualizer";

// ─── Config ────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL;

// ─── Example test sets ───────────────────────────────────────────────────────
const EXAMPLES = [
  {
    label: "Simple Tree",
    data: ["A->B", "A->C", "B->D"],
  },
  {
    label: "Deep Chain",
    data: ["A->B", "B->C", "C->D", "D->E"],
  },
  {
    label: "With Cycle",
    data: ["A->B", "B->C", "C->A"],
  },
  {
    label: "Multi-root",
    data: ["A->B", "A->C", "D->E", "D->F"],
  },
  {
    label: "With Invalids",
    data: ["A->B", "hello", "1->2", "A->A", "AB->C", "A->C"],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function syntaxHighlightJSON(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-bool";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

// ─── App Component ─────────────────────────────────────────────────────────
export default function App() {
  const [input, setInput] = useState('A->B\nA->C\nB->D');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);

  // ── Submit Handler ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setJsonOpen(false);

    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    try {
      const res = await fetch(`${API_URL}/bfhl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: lines }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      if (err.name === "TypeError") {
        setError("Cannot connect to the API server. Make sure the backend is running on port 5000.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const loadExample = (ex) => {
    setInput(ex.data.join("\n"));
    setResult(null);
    setError(null);
  };

  const lineCount = input.split("\n").filter((l) => l.trim()).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-icon">[+]</div>
              <div>
                <div className="logo-text">BFHL</div>
                <div className="logo-sub">Node Hierarchy Analyzer</div>
              </div>
            </div>
            <div className="status-badge">
              <div className="status-dot" />
              API Ready
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="hero">
        <div className="container">
          <div className="hero-tag">POST /bfhl</div>
          <h1 className="hero-title">Hierarchical Graph Processor</h1>
          <p className="hero-subtitle">
            Input edge relationships (X→Y format), detect cycles, build trees, and get instant structural insights.
          </p>
        </div>
      </div>

      {/* Main */}
      <main className="main">
        <div className="container">
          <div className="content-grid">
            {/* Input Panel */}
            <div className="card input-panel">
              <div className="card-header">
                <div className="card-icon">{">_"}</div>
                <div>
                  <div className="card-title">Input Edges</div>
                  <div className="card-title-sub">One edge per line · Format: X→Y</div>
                </div>
              </div>

              {/* Example chips */}
              <div className="examples-label">Quick examples</div>
              <div className="examples-row">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    id={`example-${ex.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className="example-chip"
                    onClick={() => loadExample(ex)}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="textarea-wrapper">
                <textarea
                  id="edge-input"
                  placeholder={"A->B\nA->C\nB->D\n..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  autoComplete="off"
                />
                <span className="textarea-hint">{lineCount} edge{lineCount !== 1 ? "s" : ""}</span>
              </div>

              {/* Submit */}
              <button
                id="submit-btn"
                className="btn-submit"
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <span>[RUN]</span>
                    <span>Analyze Hierarchy</span>
                    <span style={{ fontSize: "11px", opacity: 0.6 }}>RET</span>
                  </>
                )}
              </button>

              {/* Error */}
              {error && (
                <div className="error-banner" id="error-msg">
                  ⛔ {error}
                </div>
              )}
            </div>

            {/* Tips Panel */}
            <div className="card tips-panel">
              <div className="card-header">
                <div className="card-icon">[ i ]</div>
                <div>
                  <div className="card-title">Format Rules</div>
                  <div className="card-title-sub">What's valid & what's not</div>
                </div>
              </div>

              {[
                {
                  icon: "[+]",
                  type: "valid",
                  title: "Valid edges",
                  desc: "A->B  ·  X->Y  ·  Single uppercase letters only",
                },
                {
                  icon: "❌",
                  type: "invalid",
                  title: "Self-loops rejected",
                  desc: "A->A is invalid — source and target cannot match",
                },
                {
                  icon: "❌",
                  type: "invalid",
                  title: "Bad formats rejected",
                  desc: "1->2  ·  AB->C  ·  hello  ·  A-B  ·  A->",
                },
                {
                  icon: "ℹ️",
                  type: "info",
                  title: "First parent wins",
                  desc: "If B already has parent A, then C->B is ignored",
                },
                {
                  icon: "ℹ️",
                  type: "info",
                  title: "Duplicates tracked",
                  desc: "Repeated edges go into duplicate_edges list",
                },
                {
                  icon: "ℹ️",
                  type: "info",
                  title: "Cycles detected",
                  desc: "DFS-based detection · cycle trees show has_cycle: true",
                },
              ].map((tip) => (
                <div key={tip.title} className="tip-item">
                  <div className={`tip-icon ${tip.type}`}>{tip.icon}</div>
                  <div className="tip-content">
                    <strong>{tip.title}</strong>
                    <p>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="results-section" id="results-section">
              <div className="results-heading">Analysis Results</div>

              {/* Summary Stats */}
              <div className="stats-grid" id="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{result.hierarchies?.length ?? 0}</div>
                  <div className="stat-label">Total Groups</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value emerald">{result.summary?.total_trees ?? 0}</div>
                  <div className="stat-label">Valid Trees</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value rose">{result.summary?.total_cycles ?? 0}</div>
                  <div className="stat-label">Cycles</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {result.summary?.largest_tree_root ?? "—"}
                  </div>
                  <div className="stat-label">Largest Root</div>
                </div>
              </div>

              {/* Invalid + Duplicate lists */}
              {(result.invalid_entries?.length > 0 || result.duplicate_edges?.length > 0) && (
                <div className="lists-grid">
                  {/* Invalid */}
                  <div className="list-card" id="invalid-list">
                    <div className="list-card-header">
                      <div className="list-card-title">
                        [ERR] Invalid Entries
                        <span className="count-badge rose">{result.invalid_entries?.length ?? 0}</span>
                      </div>
                    </div>
                    <div className="list-items">
                      {result.invalid_entries?.length === 0 ? (
                        <div className="empty-list">None</div>
                      ) : (
                        result.invalid_entries.map((entry, i) => (
                          <div key={i} className="list-item rose">
                            <div className="list-dot rose" />
                            <code>{String(entry) || "(empty)"}</code>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Duplicates */}
                  <div className="list-card" id="duplicate-list">
                    <div className="list-card-header">
                      <div className="list-card-title">
                        [WARN] Duplicate Edges
                        <span className="count-badge amber">{result.duplicate_edges?.length ?? 0}</span>
                      </div>
                    </div>
                    <div className="list-items">
                      {result.duplicate_edges?.length === 0 ? (
                        <div className="empty-list">None</div>
                      ) : (
                        result.duplicate_edges.map((entry, i) => (
                          <div key={i} className="list-item amber">
                            <div className="list-dot amber" />
                            <code>{entry}</code>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Hierarchies */}
              {result.hierarchies?.length > 0 && (
                <>
                  <div className="results-heading" style={{ marginTop: 0, marginBottom: 16 }}>
                    Tree Hierarchies
                  </div>
                  <div className="hierarchies-grid" id="hierarchies-grid">
                    {result.hierarchies.map((h, idx) => (
                      <div
                        key={idx}
                        className={`hierarchy-card${h.has_cycle ? " has-cycle" : ""}`}
                        id={`hierarchy-${h.root}`}
                      >
                        <div className="hierarchy-header">
                          <div className="hierarchy-root">
                            <div className={`root-badge${h.has_cycle ? " cycle" : ""}`}>
                              {h.root}
                            </div>
                            <div className="root-info">
                              <strong>Root: {h.root}</strong>
                              <small>
                                {h.has_cycle ? "Cyclic group" : `${h.depth} level${h.depth !== 1 ? "s" : ""} deep`}
                              </small>
                            </div>
                          </div>
                          {h.has_cycle ? (
                            <span className="cycle-badge">⟳ Cycle</span>
                          ) : (
                            <span className="depth-badge">depth {h.depth}</span>
                          )}
                        </div>

                        <div className="hierarchy-body">
                          {h.has_cycle ? (
                            <div className="tree-empty">
                              <span>[!]</span>
                              <span>Cycle detected — no root tree</span>
                            </div>
                          ) : Object.keys(h.tree).length === 0 ? (
                            <div className="tree-empty">
                              <span>[*]</span>
                              <span>Single isolated node</span>
                            </div>
                          ) : (
                            <TreeVisualizer tree={h.tree} root={h.root} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Raw JSON toggle */}
              <div className="card" style={{ marginTop: 16 }}>
                <div
                  className="json-toggle"
                  onClick={() => setJsonOpen((o) => !o)}
                  id="json-toggle"
                >
                  <span className="json-toggle-label">
                    <span>{ }</span> Raw JSON Response
                  </span>
                  <span className={`json-toggle-arrow${jsonOpen ? " open" : ""}`}>▼</span>
                </div>
                {jsonOpen && (
                  <div
                    className="json-view"
                    id="json-view"
                    dangerouslySetInnerHTML={{ __html: syntaxHighlightJSON(result) }}
                  />
                )}
              </div>

              {/* User info strip */}
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginTop: 16,
                  padding: "14px 20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  flexWrap: "wrap",
                }}
                id="user-info"
              >
                <span>🆔 <strong style={{ color: "var(--text-secondary)" }}>{result.user_id}</strong></span>
                <span>📧 <strong style={{ color: "var(--text-secondary)" }}>{result.email_id}</strong></span>
                <span>🎓 <strong style={{ color: "var(--text-secondary)" }}>{result.college_roll_number}</strong></span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>Built with <span>♥</span> · BFHL Assessment · POST /bfhl</p>
        </div>
      </footer>
    </div>
  );
}
