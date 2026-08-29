const express = require("express");
const axios = require("axios");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { slugify } = require("../utils/validate");

const router = express.Router();

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

router.get("/status", requireAuth, (req, res) => {
  res.json({ configured: !!process.env.ANTHROPIC_API_KEY });
});

/**
 * POST /api/ai/discover
 * Body: { topic?: string }
 *
 * Uses Claude (with the web_search tool) to look up real Kenyan movies -
 * released or upcoming - across the web (news sites, YouTube channels,
 * festival listings, etc.) and returns a structured list. Admins can then
 * review the results and import the ones they want into the catalog.
 *
 * This endpoint NEVER writes to the database by itself - it only proposes
 * candidates. Use POST /api/ai/import to actually save selected movies.
 */
router.post("/discover", requireAuth, requireAdmin, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({
      error:
        "AI discovery is not configured. Set ANTHROPIC_API_KEY in the backend .env file to enable it.",
    });
  }

  const topic = (req.body && req.body.topic) || "upcoming and recently released Kenyan movies";

  const systemPrompt = `You are a research assistant for KeReview, a Kenyan movie review platform.
Use web search to find REAL Kenyan films (feature films or notable short films made in Kenya,
by Kenyan filmmakers, or Kenyan productions/co-productions) - both already-released titles and
upcoming/announced ones. Check sources like Kenyan news sites, YouTube channels of Kenyan studios
(e.g. Kenyan film YouTube channels), film festival listings, and entertainment blogs.

Respond with ONLY a JSON array (no markdown fences, no commentary) of up to 8 movies, each with
this exact shape:
{
  "title": string,
  "releaseYear": number|null,
  "status": "released" | "upcoming",
  "genres": string[],
  "director": string,
  "synopsis": string (2-4 original sentences, written by you, describing the plot/premise - do not copy text verbatim from any source),
  "language": string,
  "sourceUrls": string[] (the web pages you used to verify this)
}
Only include titles you are reasonably confident are real Kenyan productions. If you are unsure
about a field, use an empty string, empty array, or null rather than guessing.`;

  try {
    const response = await axios.post(
      ANTHROPIC_URL,
      {
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Find ${topic}. Return the JSON array now.`,
          },
        ],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      },
      {
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        timeout: 60000,
      }
    );

    const blocks = response.data.content || [];
    const text = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(502).json({
        error: "The AI response could not be parsed. Try again.",
        raw: text.slice(0, 500),
      });
    }

    let candidates;
    try {
      candidates = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return res.status(502).json({ error: "The AI returned malformed JSON. Try again." });
    }

    // Mark which candidates already exist in the catalog (by slug match) so the
    // frontend can show "already in catalog" instead of risking duplicates.
    const existingSlugs = new Set(
      db.prepare("SELECT slug FROM movies").all().map((r) => r.slug)
    );

    const enriched = candidates.map((c) => ({
      ...c,
      slug: slugify(c.title || "untitled", c.releaseYear),
      alreadyInCatalog: existingSlugs.has(slugify(c.title || "untitled", c.releaseYear)),
    }));

    res.json({ candidates: enriched });
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    res.status(502).json({ error: `AI discovery failed: ${message}` });
  }
});

/**
 * POST /api/ai/import
 * Body: { movies: [ ...candidate objects from /discover... ] }
 * Saves selected AI-discovered candidates into the movie catalog.
 */
router.post("/import", requireAuth, requireAdmin, (req, res) => {
  const movies = Array.isArray(req.body?.movies) ? req.body.movies : [];
  if (movies.length === 0) return res.status(400).json({ error: "No movies provided to import." });

  const insert = db.prepare(`
    INSERT OR IGNORE INTO movies
      (id, title, slug, synopsis, genres, release_year, status, director, cast, language, source_urls, is_kenyan, added_by_ai)
    VALUES (@id, @title, @slug, @synopsis, @genres, @release_year, @status, @director, @cast, @language, @source_urls, 1, 1)
  `);

  const tx = db.transaction((rows) => {
    let count = 0;
    for (const m of rows) {
      if (!m.title) continue;
      const info = insert.run({
        id: uuid(),
        title: m.title,
        slug: slugify(m.title, m.releaseYear),
        synopsis: m.synopsis || "",
        genres: JSON.stringify(m.genres || []),
        release_year: m.releaseYear || null,
        status: m.status === "upcoming" ? "upcoming" : "released",
        director: m.director || "",
        cast: JSON.stringify([]),
        language: m.language || "Swahili/English",
        source_urls: JSON.stringify(m.sourceUrls || []),
      });
      if (info.changes > 0) count++;
    }
    return count;
  });

  const imported = tx(movies);
  res.json({ success: true, imported });
});

module.exports = router;
