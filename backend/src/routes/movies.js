const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth, optionalAuth, requireAdmin } = require("../middleware/auth");
const { slugify } = require("../utils/validate");

const router = express.Router();

function parseMovieRow(row, extra = {}) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    synopsis: row.synopsis,
    genres: safeParse(row.genres, []),
    releaseYear: row.release_year,
    releaseDate: row.release_date,
    status: row.status,
    director: row.director,
    cast: safeParse(row.cast, []),
    language: row.language,
    countyOrigin: row.county_origin,
    posterUrl: row.poster_url,
    trailerUrl: row.trailer_url,
    sourceUrls: safeParse(row.source_urls, []),
    isKenyan: !!row.is_kenyan,
    addedByAi: !!row.added_by_ai,
    createdAt: row.created_at,
    avgRating: extra.avgRating ?? row.avg_rating ?? null,
    reviewCount: extra.reviewCount ?? row.review_count ?? 0,
    inWatchlist: extra.inWatchlist ?? false,
    myRating: extra.myRating ?? null,
  };
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

const RATINGS_SUBQUERY = `
  (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE reviews.movie_id = movies.id) as avg_rating,
  (SELECT COUNT(*) FROM reviews WHERE reviews.movie_id = movies.id) as review_count
`;

// GET /api/movies?query=&genre=&status=&sort=
router.get("/", optionalAuth, (req, res) => {
  const { query, genre, status, sort } = req.query;

  let sql = `SELECT movies.*, ${RATINGS_SUBQUERY} FROM movies WHERE 1=1`;
  const params = [];

  if (query) {
    sql += ` AND (title LIKE ? OR synopsis LIKE ? OR director LIKE ?)`;
    const q = `%${query}%`;
    params.push(q, q, q);
  }
  if (status && ["released", "upcoming"].includes(status)) {
    sql += ` AND status = ?`;
    params.push(status);
  }
  if (genre) {
    sql += ` AND genres LIKE ?`;
    params.push(`%${genre}%`);
  }

  if (sort === "rating") sql += ` ORDER BY avg_rating DESC NULLS LAST`;
  else if (sort === "oldest") sql += ` ORDER BY release_year ASC`;
  else if (sort === "az") sql += ` ORDER BY title ASC`;
  else sql += ` ORDER BY release_year DESC, movies.created_at DESC`;

  const rows = db.prepare(sql).all(...params);

  let watchlistSet = new Set();
  if (req.user) {
    const wl = db.prepare("SELECT movie_id FROM watchlist WHERE user_id = ?").all(req.user.id);
    watchlistSet = new Set(wl.map((r) => r.movie_id));
  }

  res.json({
    movies: rows.map((r) =>
      parseMovieRow(r, { inWatchlist: watchlistSet.has(r.id) })
    ),
  });
});

router.get("/genres", (req, res) => {
  const rows = db.prepare("SELECT genres FROM movies").all();
  const set = new Set();
  rows.forEach((r) => safeParse(r.genres, []).forEach((g) => set.add(g)));
  res.json({ genres: Array.from(set).sort() });
});

router.get("/:idOrSlug", optionalAuth, (req, res) => {
  const { idOrSlug } = req.params;
  const row = db
    .prepare(`SELECT movies.*, ${RATINGS_SUBQUERY} FROM movies WHERE id = ? OR slug = ?`)
    .get(idOrSlug, idOrSlug);
  if (!row) return res.status(404).json({ error: "Movie not found." });

  let inWatchlist = false;
  let myRating = null;
  if (req.user) {
    inWatchlist = !!db
      .prepare("SELECT 1 FROM watchlist WHERE user_id = ? AND movie_id = ?")
      .get(req.user.id, row.id);
    const myReview = db
      .prepare("SELECT rating FROM reviews WHERE user_id = ? AND movie_id = ?")
      .get(req.user.id, row.id);
    myRating = myReview ? myReview.rating : null;
  }

  res.json({ movie: parseMovieRow(row, { inWatchlist, myRating }) });
});

// Admin (or any signed-in user, if you prefer an open catalog) can add movies manually.
router.post("/", requireAuth, requireAdmin, (req, res) => {
  const {
    title,
    synopsis,
    genres,
    releaseYear,
    releaseDate,
    status,
    director,
    cast,
    language,
    countyOrigin,
    posterUrl,
    trailerUrl,
    sourceUrls,
  } = req.body || {};

  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required." });

  const id = uuid();
  const slug = slugify(title, releaseYear);

  db.prepare(
    `INSERT INTO movies
      (id, title, slug, synopsis, genres, release_year, release_date, status, director, cast, language, county_origin, poster_url, trailer_url, source_urls, is_kenyan, added_by_ai)
     VALUES (@id, @title, @slug, @synopsis, @genres, @release_year, @release_date, @status, @director, @cast, @language, @county_origin, @poster_url, @trailer_url, @source_urls, 1, 0)`
  ).run({
    id,
    title: title.trim(),
    slug,
    synopsis: synopsis || "",
    genres: JSON.stringify(genres || []),
    release_year: releaseYear || null,
    release_date: releaseDate || null,
    status: status === "upcoming" ? "upcoming" : "released",
    director: director || "",
    cast: JSON.stringify(cast || []),
    language: language || "Swahili/English",
    county_origin: countyOrigin || "",
    poster_url: posterUrl || "",
    trailer_url: trailerUrl || "",
    source_urls: JSON.stringify(sourceUrls || []),
  });

  const row = db.prepare(`SELECT movies.*, ${RATINGS_SUBQUERY} FROM movies WHERE id = ?`).get(id);
  res.status(201).json({ movie: parseMovieRow(row) });
});

router.put("/:id", requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT * FROM movies WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Movie not found." });

  const b = req.body || {};
  db.prepare(
    `UPDATE movies SET
      title = ?, synopsis = ?, genres = ?, release_year = ?, release_date = ?,
      status = ?, director = ?, cast = ?, language = ?, county_origin = ?,
      poster_url = ?, trailer_url = ?, source_urls = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    b.title ?? existing.title,
    b.synopsis ?? existing.synopsis,
    JSON.stringify(b.genres ?? safeParse(existing.genres, [])),
    b.releaseYear ?? existing.release_year,
    b.releaseDate ?? existing.release_date,
    b.status ?? existing.status,
    b.director ?? existing.director,
    JSON.stringify(b.cast ?? safeParse(existing.cast, [])),
    b.language ?? existing.language,
    b.countyOrigin ?? existing.county_origin,
    b.posterUrl ?? existing.poster_url,
    b.trailerUrl ?? existing.trailer_url,
    JSON.stringify(b.sourceUrls ?? safeParse(existing.source_urls, [])),
    req.params.id
  );

  const row = db
    .prepare(`SELECT movies.*, ${RATINGS_SUBQUERY} FROM movies WHERE id = ?`)
    .get(req.params.id);
  res.json({ movie: parseMovieRow(row) });
});

router.delete("/:id", requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM movies WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Movie not found." });
  res.json({ success: true });
});

module.exports = router;
