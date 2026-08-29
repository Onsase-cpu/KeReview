import { useEffect, useState } from "react";
import { api } from "../api";
import { PageLoader } from "../App.jsx";

const TYPE_LABELS = { movie: "🎬 Movie", tv: "📺 TV Series", book: "📖 Book" };
const STATUS_LABELS = {
  in_progress: "In progress",
  completed: "Completed",
  on_hold: "On hold",
  dropped: "Dropped",
};

const emptyForm = { title: "", type: "movie", status: "in_progress", progressNote: "", notes: "" };

export default function MyList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .getMyList(typeFilter ? { type: typeFilter } : {})
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [typeFilter]);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      title: item.title,
      type: item.type,
      status: item.status,
      progressNote: item.progressNote,
      notes: item.notes,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.updateMyListItem(editingId, form);
      } else {
        await api.addMyListItem(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Remove this item from your list?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.deleteMyListItem(id);
    } catch (err) {
      alert(err.message);
      load();
    }
  };

  const quickStatus = async (item, status) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)));
    try {
      await api.updateMyListItem(item.id, { status });
    } catch (err) {
      alert(err.message);
      load();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>My List</h1>
          <p className="text-muted">Movies, TV series and books you're currently enjoying — or paused on.</p>
        </div>
        <button className="clay-btn" onClick={openNew}>+ Add item</button>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "20px 0 28px" }}>
        {["", "movie", "tv", "book"].map((t) => (
          <button
            key={t || "all"}
            className={`clay-btn sm ${typeFilter === t ? "" : "ghost"}`}
            onClick={() => setTypeFilter(t)}
          >
            {t ? TYPE_LABELS[t] : "All"}
          </button>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">📚</span>
          <h3>Nothing here yet</h3>
          <p>Add a movie, TV series or book you're currently watching or reading.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {items.map((item) => (
            <div key={item.id} className="glass-panel" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="badge">{TYPE_LABELS[item.type]}</span>
                <select
                  className="clay-select"
                  style={{ width: "auto", padding: "6px 10px", fontSize: "0.78rem" }}
                  value={item.status}
                  onChange={(e) => quickStatus(item, e.target.value)}
                >
                  {Object.entries(STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>
              <h3 style={{ marginTop: 12, marginBottom: 4 }}>{item.title}</h3>
              {item.progressNote && (
                <p className="text-muted" style={{ fontSize: "0.85rem", margin: "0 0 8px" }}>
                  📍 {item.progressNote}
                </p>
              )}
              {item.notes && <p style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>{item.notes}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="clay-btn ghost sm" onClick={() => openEdit(item)}>Edit</button>
                <button className="clay-btn ghost sm" onClick={() => remove(item.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setShowForm(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="glass-panel-strong"
            style={{ padding: 28, maxWidth: 440, width: "100%", display: "flex", flexDirection: "column", gap: 12 }}
          >
            <h3>{editingId ? "Edit item" : "Add to My List"}</h3>
            <input
              className="clay-input"
              placeholder="Title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <select
                className="clay-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="movie">🎬 Movie</option>
                <option value="tv">📺 TV Series</option>
                <option value="book">📖 Book</option>
              </select>
              <select
                className="clay-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {Object.entries(STATUS_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
            <input
              className="clay-input"
              placeholder="Progress (e.g. Season 2 Ep 4, or Page 120)"
              value={form.progressNote}
              onChange={(e) => setForm({ ...form, progressNote: e.target.value })}
            />
            <textarea
              className="clay-textarea"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button className="clay-btn" type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Add item"}
              </button>
              <button className="clay-btn ghost" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
