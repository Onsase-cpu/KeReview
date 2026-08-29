import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

export default function Discover() {
  const { user } = useAuth();
  const [configured, setConfigured] = useState(true);
  const [topic, setTopic] = useState("upcoming Kenyan movies premiering this year");
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    api.aiStatus().then((d) => setConfigured(d.configured)).catch(() => {});
  }, []);

  if (!user?.isAdmin) return <Navigate to="/" replace />;

  const runDiscovery = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setCandidates([]);
    try {
      const { candidates } = await api.aiDiscover(topic);
      setCandidates(candidates);
      setSelected(new Set(candidates.filter((c) => !c.alreadyInCatalog).map((_, i) => i)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const importSelected = async () => {
    const toImport = candidates.filter((_, i) => selected.has(i));
    if (toImport.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const { imported } = await api.aiImport(toImport);
      setSuccessMsg(`Imported ${imported} movie${imported === 1 ? "" : "s"} into the catalog.`);
      setCandidates((prev) => prev.filter((_, i) => !selected.has(i)));
      setSelected(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h1>AI Discover</h1>
      <p className="text-muted" style={{ marginBottom: 24 }}>
        Use AI-powered web search to find real and upcoming Kenyan movies from news sites, YouTube
        and film blogs, then review and import the ones you trust into the catalog.
      </p>

      {!configured && (
        <div className="error-banner">
          AI discovery isn't configured yet. Add <code>ANTHROPIC_API_KEY</code> to the backend's{" "}
          <code>.env</code> file and restart the server to enable this feature.
        </div>
      )}

      <div className="glass-panel" style={{ padding: 20, marginBottom: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          className="clay-input"
          style={{ flex: 1, minWidth: 240 }}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What should the AI look for?"
        />
        <button className="clay-btn" onClick={runDiscovery} disabled={loading || !configured}>
          {loading ? "Searching…" : "🔎 Run discovery"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      {candidates.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p className="text-muted">{candidates.length} candidates found — select which to import.</p>
            <button className="clay-btn gold sm" onClick={importSelected} disabled={importing || selected.size === 0}>
              {importing ? "Importing…" : `Import selected (${selected.size})`}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {candidates.map((c, i) => (
              <label
                key={i}
                className="glass-panel"
                style={{
                  padding: 18,
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  cursor: c.alreadyInCatalog ? "not-allowed" : "pointer",
                  opacity: c.alreadyInCatalog ? 0.55 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  disabled={c.alreadyInCatalog}
                  onChange={() => toggle(i)}
                  style={{ marginTop: 4, width: 18, height: 18 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <strong>{c.title}</strong>
                    <span className={`badge ${c.status === "upcoming" ? "upcoming" : "released"}`}>
                      {c.status === "upcoming" ? "Upcoming" : c.releaseYear || "Released"}
                    </span>
                    {c.alreadyInCatalog && <span className="badge">Already in catalog</span>}
                  </div>
                  <p className="text-muted" style={{ margin: "6px 0" }}>{c.synopsis}</p>
                  <p style={{ fontSize: "0.82rem", margin: 0 }} className="text-muted">
                    {c.director ? `Dir. ${c.director} · ` : ""}
                    {c.genres?.join(", ")}
                  </p>
                  {c.sourceUrls?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {c.sourceUrls.map((u) => (
                        <a key={u} href={u} target="_blank" rel="noreferrer" className="badge">
                          {u.replace(/^https?:\/\//, "").slice(0, 30)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
