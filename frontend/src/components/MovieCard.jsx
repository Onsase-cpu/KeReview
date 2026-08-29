import { Link } from "react-router-dom";

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(160deg, #1c3d29, #0d1a13)",
  "linear-gradient(160deg, #3d1c22, #1a0d0f)",
  "linear-gradient(160deg, #3d331c, #1a170d)",
  "linear-gradient(160deg, #1c2a3d, #0d131a)",
];

function gradientFor(title) {
  const idx = (title || "").length % PLACEHOLDER_GRADIENTS.length;
  return PLACEHOLDER_GRADIENTS[idx];
}

export default function MovieCard({ movie }) {
  return (
    <Link
      to={`/movies/${movie.slug || movie.id}`}
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div
        style={{
          aspectRatio: "2 / 3",
          background: movie.posterUrl ? `url(${movie.posterUrl}) center/cover` : gradientFor(movie.title),
          display: "flex",
          alignItems: "flex-end",
          padding: 12,
          position: "relative",
        }}
      >
        {!movie.posterUrl && (
          <span style={{ position: "absolute", top: "40%", left: 0, right: 0, textAlign: "center", fontSize: "2.4rem" }}>
            🎬
          </span>
        )}
        <span className={`badge ${movie.status === "upcoming" ? "upcoming" : "released"}`}>
          {movie.status === "upcoming" ? "Upcoming" : movie.releaseYear || "Released"}
        </span>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <h3 style={{ fontSize: "1.02rem", marginBottom: 4 }}>{movie.title}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }} className="text-muted">
          {movie.avgRating ? (
            <>
              <span style={{ color: "var(--ke-gold)" }}>★</span>
              <span>{movie.avgRating}</span>
              <span>· {movie.reviewCount} review{movie.reviewCount === 1 ? "" : "s"}</span>
            </>
          ) : (
            <span>No reviews yet</span>
          )}
        </div>
        {movie.genres?.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {movie.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                style={{
                  fontSize: "0.72rem",
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
