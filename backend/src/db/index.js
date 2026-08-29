const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || "./data/kereview.sqlite";
const resolvedPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(process.cwd(), DB_PATH);

const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(resolvedPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#0A7B3E',
  bio TEXT DEFAULT '',
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  synopsis TEXT DEFAULT '',
  genres TEXT DEFAULT '[]',
  release_year INTEGER,
  release_date TEXT,
  status TEXT DEFAULT 'released', -- 'released' | 'upcoming'
  director TEXT DEFAULT '',
  cast TEXT DEFAULT '[]',
  language TEXT DEFAULT 'Swahili/English',
  county_origin TEXT DEFAULT '',
  poster_url TEXT DEFAULT '',
  trailer_url TEXT DEFAULT '',
  source_urls TEXT DEFAULT '[]',
  is_kenyan INTEGER DEFAULT 1,
  added_by_ai INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(movie_id, user_id)
);

CREATE TABLE IF NOT EXISTS watchlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, movie_id)
);

-- Generic personal tracker: movies / tv series / books the user is currently
-- watching or reading. These are free-form entries (not tied to the Kenyan
-- movie catalog) so a user can log anything they're consuming right now.
CREATE TABLE IF NOT EXISTS my_list (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'movie', -- 'movie' | 'tv' | 'book'
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed' | 'on_hold' | 'dropped'
  progress_note TEXT DEFAULT '', -- e.g. "Season 2 Episode 4" or "Page 120"
  notes TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_movie ON reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_mylist_user ON my_list(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
`);

module.exports = db;
