import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageLoader } from "../App.jsx";

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .getWatchlist()
      .then((d) => setItems(d.watchlist))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (movieId) => {
    setItems((prev) => prev.filter((i) => i.id !== movieId));
    try {
      await api.removeFromWatchlist(movieId);
    } catch (err) {
      alert(err.message);
      load();
    }
  };

  return (
    <div>
      <h1>Your Watchlist</h1>
      <p className="text-muted" style={{ marginBottom: 28 }}>
        Movies you're planning to watch, all in one place.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">📋</span>
          <h3>Your watchlist is empty</h3>
          <p>
            Browse the <Link to="/" style={{ color: "var(--ke-gold)" }}>catalog</Link> and tap "Add to watchlist" on any movie.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((m) => (
            <div
              key={m.id}
              className="glass-panel"
              style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}
            >
              <div
                style={{
                  width: 56,
                  height: 80,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: m.posterUrl ? `url(${m.posterUrl}) center/cover` : "linear-gradient(160deg, #1c3d29, #0d1a13)",
                }}
              />
              <div style={{ flex: 1 }}>
                <Link to={`/movies/${m.slug}`} style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                  {m.title}
                </Link>
                <div className="text-muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                  {m.releaseYear || "TBA"} · {m.status === "upcoming" ? "Upcoming" : "Released"}
                  {m.avgRating ? ` · ★ ${m.avgRating}` : ""}
                </div>
              </div>
              <button className="clay-btn ghost sm" onClick={() => remove(m.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
