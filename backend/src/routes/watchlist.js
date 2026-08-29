const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

router.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT movies.*, watchlist.created_at as added_at,
        (SELECT ROUND(AVG(rating),2) FROM reviews WHERE reviews.movie_id = movies.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE reviews.movie_id = movies.id) as review_count
       FROM watchlist
       JOIN movies ON movies.id = watchlist.movie_id
       WHERE watchlist.user_id = ?
       ORDER BY watchlist.created_at DESC`
    )
    .all(req.user.id);

  res.json({
    watchlist: rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      synopsis: r.synopsis,
      genres: safeParse(r.genres, []),
      releaseYear: r.release_year,
      status: r.status,
      posterUrl: r.poster_url,
      avgRating: r.avg_rating,
      reviewCount: r.review_count,
      addedAt: r.added_at,
    })),
  });
});

router.post("/:movieId", requireAuth, (req, res) => {
  const movie = db.prepare("SELECT id FROM movies WHERE id = ?").get(req.params.movieId);
  if (!movie) return res.status(404).json({ error: "Movie not found." });

  const existing = db
    .prepare("SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?")
    .get(req.user.id, req.params.movieId);
  if (existing) return res.status(200).json({ success: true, alreadyAdded: true });

  db.prepare("INSERT INTO watchlist (id, user_id, movie_id) VALUES (?, ?, ?)").run(
    uuid(),
    req.user.id,
    req.params.movieId
  );
  res.status(201).json({ success: true });
});

router.delete("/:movieId", requireAuth, (req, res) => {
  db.prepare("DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?").run(
    req.user.id,
    req.params.movieId
  );
  res.json({ success: true });
});

module.exports = router;
