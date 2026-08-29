import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api";
import StarRating from "./StarRating.jsx";

function timeAgo(dateStr) {
  const date = new Date(dateStr + "Z");
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [name, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value} ${name}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export default function ReviewList({ movieId, reviews, myRating, onReviewsChange }) {
  const { user } = useAuth();
  const existingMine = reviews.find((r) => r.user.id === user?.id);
  const [rating, setRating] = useState(existingMine?.rating || myRating || 0);
  const [comment, setComment] = useState(existingMine?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!rating) {
      setError("Please pick a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      await api.submitReview(movieId, { rating, comment });
      const { reviews: updated } = await api.getReviews(movieId);
      onReviewsChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api.deleteReview(id);
      const { reviews: updated } = await api.getReviews(movieId);
      onReviewsChange(updated);
      if (id === existingMine?.id) {
        setRating(0);
        setComment("");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {user && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: 12 }}>
            {existingMine ? "Update your review" : "Leave a review"}
          </h3>
          <div style={{ marginBottom: 12 }}>
            <StarRating value={rating} onChange={setRating} size={26} />
          </div>
          <textarea
            className="clay-textarea"
            placeholder="What did you think? Share your honest thoughts…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <button className="clay-btn" disabled={submitting} type="submit">
              {submitting ? "Saving…" : existingMine ? "Update review" : "Post review"}
            </button>
            {existingMine && (
              <button
                type="button"
                className="clay-btn danger sm"
                onClick={() => handleDelete(existingMine.id)}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">💬</span>
          <p>No reviews yet — be the first to share your take!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {reviews.map((r) => (
            <div key={r.id} className="glass-panel" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: r.user.avatarColor || "var(--ke-green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {r.user.name?.[0]?.toUpperCase() || "K"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.user.name}</div>
                    <div style={{ fontSize: "0.78rem" }} className="text-muted">
                      {timeAgo(r.createdAt)}
                    </div>
                  </div>
                </div>
                <StarRating value={r.rating} readOnly size={16} />
              </div>
              {r.comment && <p style={{ marginTop: 12, marginBottom: 0, lineHeight: 1.55 }}>{r.comment}</p>}
              {user?.id === r.user.id && (
                <button
                  className="clay-btn ghost sm"
                  style={{ marginTop: 10 }}
                  onClick={() => handleDelete(r.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
