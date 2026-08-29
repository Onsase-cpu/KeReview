const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

function reviewRow(row) {
  return {
    id: row.id,
    movieId: row.movie_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: row.user_id,
      name: row.user_name,
      avatarColor: row.avatar_color,
    },
  };
}

// GET /api/movies/:movieId/reviews
router.get("/movies/:movieId/reviews", optionalAuth, (req, res) => {
  const movie = db.prepare("SELECT id FROM movies WHERE id = ?").get(req.params.movieId);
  if (!movie) return res.status(404).json({ error: "Movie not found." });

  const rows = db
    .prepare(
      `SELECT reviews.*, users.name as user_name, users.avatar_color as avatar_color
       FROM reviews JOIN users ON users.id = reviews.user_id
       WHERE movie_id = ?
       ORDER BY reviews.created_at DESC`
    )
    .all(req.params.movieId);

  res.json({ reviews: rows.map(reviewRow) });
});

// POST /api/movies/:movieId/reviews  { rating, comment }
router.post("/movies/:movieId/reviews", requireAuth, (req, res) => {
  const movie = db.prepare("SELECT id FROM movies WHERE id = ?").get(req.params.movieId);
  if (!movie) return res.status(404).json({ error: "Movie not found." });

  const { rating, comment } = req.body || {};
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: "Rating must be a whole number from 1 to 5." });
  }

  const existing = db
    .prepare("SELECT id FROM reviews WHERE movie_id = ? AND user_id = ?")
    .get(req.params.movieId, req.user.id);

  if (existing) {
    db.prepare(
      `UPDATE reviews SET rating = ?, comment = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(r, comment || "", existing.id);
    const row = db
      .prepare(
        `SELECT reviews.*, users.name as user_name, users.avatar_color as avatar_color
         FROM reviews JOIN users ON users.id = reviews.user_id WHERE reviews.id = ?`
      )
      .get(existing.id);
    return res.json({ review: reviewRow(row), updated: true });
  }

  const id = uuid();
  db.prepare(
    `INSERT INTO reviews (id, movie_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)`
  ).run(id, req.params.movieId, req.user.id, r, comment || "");

  const row = db
    .prepare(
      `SELECT reviews.*, users.name as user_name, users.avatar_color as avatar_color
       FROM reviews JOIN users ON users.id = reviews.user_id WHERE reviews.id = ?`
    )
    .get(id);
  res.status(201).json({ review: reviewRow(row) });
});

router.delete("/reviews/:id", requireAuth, (req, res) => {
  const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id);
  if (!review) return res.status(404).json({ error: "Review not found." });
  if (review.user_id !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({ error: "You can only delete your own reviews." });
  }
  db.prepare("DELETE FROM reviews WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
