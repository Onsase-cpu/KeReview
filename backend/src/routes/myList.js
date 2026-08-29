const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const TYPES = ["movie", "tv", "book"];
const STATUSES = ["in_progress", "completed", "on_hold", "dropped"];

function itemRow(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    progressNote: row.progress_note,
    notes: row.notes,
    coverUrl: row.cover_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/", requireAuth, (req, res) => {
  const { type, status } = req.query;
  let sql = "SELECT * FROM my_list WHERE user_id = ?";
  const params = [req.user.id];
  if (type && TYPES.includes(type)) {
    sql += " AND type = ?";
    params.push(type);
  }
  if (status && STATUSES.includes(status)) {
    sql += " AND status = ?";
    params.push(status);
  }
  sql += " ORDER BY updated_at DESC";
  const rows = db.prepare(sql).all(...params);
  res.json({ items: rows.map(itemRow) });
});

router.post("/", requireAuth, (req, res) => {
  const { title, type, status, progressNote, notes, coverUrl } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Title is required." });
  if (type && !TYPES.includes(type)) return res.status(400).json({ error: "Invalid type." });
  if (status && !STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status." });

  const id = uuid();
  db.prepare(
    `INSERT INTO my_list (id, user_id, title, type, status, progress_note, notes, cover_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.user.id,
    title.trim(),
    type || "movie",
    status || "in_progress",
    progressNote || "",
    notes || "",
    coverUrl || ""
  );

  const row = db.prepare("SELECT * FROM my_list WHERE id = ?").get(id);
  res.status(201).json({ item: itemRow(row) });
});

router.put("/:id", requireAuth, (req, res) => {
  const existing = db
    .prepare("SELECT * FROM my_list WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Item not found." });

  const b = req.body || {};
  if (b.type && !TYPES.includes(b.type)) return res.status(400).json({ error: "Invalid type." });
  if (b.status && !STATUSES.includes(b.status))
    return res.status(400).json({ error: "Invalid status." });

  db.prepare(
    `UPDATE my_list SET
      title = ?, type = ?, status = ?, progress_note = ?, notes = ?, cover_url = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    b.title?.trim() || existing.title,
    b.type || existing.type,
    b.status || existing.status,
    b.progressNote ?? existing.progress_note,
    b.notes ?? existing.notes,
    b.coverUrl ?? existing.cover_url,
    req.params.id
  );

  const row = db.prepare("SELECT * FROM my_list WHERE id = ?").get(req.params.id);
  res.json({ item: itemRow(row) });
});

router.delete("/:id", requireAuth, (req, res) => {
  const result = db
    .prepare("DELETE FROM my_list WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: "Item not found." });
  res.json({ success: true });
});

module.exports = router;
