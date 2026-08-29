import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import StarRating from "../components/StarRating.jsx";
import ReviewList from "../components/ReviewList.jsx";
import { PageLoader } from "../App.jsx";

export default function MovieDetail() {
  const { idOrSlug } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMovie(idOrSlug), api.getReviews(idOrSlug)])
      .then(([movieData, reviewData]) => {
        setMovie(movieData.movie);
        setReviews(reviewData.reviews);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  // re-fetch reviews using the resolved movie id once we have it (idOrSlug could be a slug)
  useEffect(() => {
    if (movie) {
      api.getReviews(movie.id).then((d) => setReviews(d.reviews)).catch(() => {});
    }
  }, [movie?.id]);

  const toggleWatchlist = async () => {
    if (!user) return;
    setWatchlistBusy(true);
    try {
      if (movie.inWatchlist) {
        await api.removeFromWatchlist(movie.id);
      } else {
        await api.addToWatchlist(movie.id);
      }
      setMovie((m) => ({ ...m, inWatchlist: !m.inWatchlist }));
    } catch (err) {
      alert(err.message);
    } finally {
      setWatchlistBusy(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <div className="error-banner">{error}</div>;
  if (!movie) return null;

  return (
    <div>
      <Link to="/" className="text-muted" style={{ display: "inline-block", marginBottom: 16 }}>
        ← Back to browse
      </Link>

      <div className="detail-layout">
        <div
          className="clay-card"
          style={{
            aspectRatio: "2 / 3",
            background: movie.posterUrl
              ? `url(${movie.posterUrl}) center/cover`
              : "linear-gradient(160deg, #1c3d29, #0d1a13)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "3rem",
          }}
        >
          {!movie.posterUrl && "🎬"}
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span className={`badge ${movie.status === "upcoming" ? "upcoming" : "released"}`}>
              {movie.status === "upcoming" ? "Upcoming" : "Released"}
            </span>
            {movie.genres.map((g) => (
              <span key={g} className="badge">{g}</span>
            ))}
            {movie.addedByAi && <span className="badge">✨ AI-discovered</span>}
          </div>

          <h1 style={{ fontSize: "2rem" }}>{movie.title}</h1>
          <p className="text-muted" style={{ marginBottom: 18 }}>
            {movie.releaseYear ? `${movie.releaseYear} · ` : ""}
            {movie.director ? `Directed by ${movie.director} · ` : ""}
            {movie.language}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <StarRating value={movie.avgRating || 0} readOnly size={24} />
            <span style={{ fontWeight: 600 }}>{movie.avgRating || "—"}</span>
            <span className="text-muted">
              ({movie.reviewCount} review{movie.reviewCount === 1 ? "" : "s"})
            </span>
          </div>

          <p style={{ lineHeight: 1.7, maxWidth: 640 }}>
            {movie.synopsis || "No synopsis available yet."}
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            {user ? (
              <button className="clay-btn" onClick={toggleWatchlist} disabled={watchlistBusy}>
                {movie.inWatchlist ? "✓ In your watchlist" : "+ Add to watchlist"}
              </button>
            ) : (
              <Link to="/login" className="clay-btn">
                Log in to add to watchlist
              </Link>
            )}
            {movie.trailerUrl && (
              <a href={movie.trailerUrl} target="_blank" rel="noreferrer" className="clay-btn ghost">
                ▶ Watch trailer
              </a>
            )}
          </div>

          {movie.sourceUrls?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p className="text-muted" style={{ fontSize: "0.8rem", marginBottom: 6 }}>Sources:</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {movie.sourceUrls.map((u) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="badge"
                    style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {u.replace(/^https?:\/\//, "")}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 style={{ marginTop: 48, marginBottom: 20 }}>Reviews</h2>
      <ReviewList
        movieId={movie.id}
        reviews={reviews}
        myRating={movie.myRating}
        onReviewsChange={setReviews}
      />

      <style>{`
        .detail-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 36px;
          align-items: start;
        }
        @media (max-width: 720px) {
          .detail-layout { grid-template-columns: 1fr; }
          .detail-layout > div:first-child { max-width: 240px; margin: 0 auto; }
        }
      `}</style>
    </div>
  );
}
