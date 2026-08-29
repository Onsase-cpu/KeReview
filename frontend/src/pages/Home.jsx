import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import MovieCard from "../components/MovieCard.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { PageLoader } from "../App.jsx";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getGenres().then((d) => setGenres(d.genres)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const timeout = setTimeout(() => {
      api
        .getMovies({ query, status, genre, sort })
        .then((d) => setMovies(d.movies))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, status, genre, sort]);

  const upcomingCount = useMemo(() => movies.filter((m) => m.status === "upcoming").length, [movies]);

  return (
    <div>
      <Hero />

      <div className="glass-panel" style={{ padding: 20, marginTop: -40, marginBottom: 32, position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }} className="filter-grid">
          <SearchBar value={query} onChange={setQuery} />
          <select className="clay-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All releases</option>
            <option value="released">Released</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <select className="clay-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select className="clay-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating">Top rated</option>
            <option value="az">A – Z</option>
          </select>
        </div>
      </div>

      {status !== "upcoming" && upcomingCount > 0 && !query && !genre && (
        <p className="text-muted" style={{ marginTop: -20, marginBottom: 24 }}>
          🎉 {upcomingCount} upcoming Kenyan {upcomingCount === 1 ? "release" : "releases"} on the way — filter by "Upcoming" to see them.
        </p>
      )}

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <PageLoader />
      ) : movies.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🎥</span>
          <h3>No movies found</h3>
          <p>Try a different search term or clear your filters.</p>
        </div>
      ) : (
        <div className="movie-grid">
          {movies.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}

      <style>{`
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 20px;
        }
        @media (max-width: 720px) {
          .filter-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .filter-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Hero() {
  return (
    <div
      className="clay-card-dark"
      style={{
        padding: "56px 40px 96px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px 300px at 20% 0%, rgba(10,123,62,0.35), transparent), radial-gradient(500px 260px at 85% 20%, rgba(200,16,46,0.28), transparent)",
        }}
      />
      <div style={{ position: "relative" }}>
        <span className="badge upcoming" style={{ marginBottom: 16 }}>🇰🇪 Made for Kenyan cinema</span>
        <h1 style={{ fontSize: "2.4rem", maxWidth: 620, margin: "16px auto" }}>
          Discover, rate & talk about the movies telling <span style={{ color: "var(--ke-gold)" }}>our</span> stories.
        </h1>
        <p className="text-muted" style={{ maxWidth: 520, margin: "0 auto" }}>
          From Riverwood classics to the newest festival premieres — track what you're watching,
          build your watchlist, and see what fellow Kenyans really think.
        </p>
      </div>
    </div>
  );
}
