const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { isValidEmail, isValidPassword } = require("../utils/validate");

const router = express.Router();

const AVATAR_COLORS = ["#0A7B3E", "#BB0000", "#111111", "#D4A017", "#1F6FEB", "#8E44AD"];

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatar_color,
    bio: user.bio,
    isAdmin: !!user.is_admin,
  };
}

router.post("/signup", (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !name.trim()) return res.status(400).json({ error: "Please enter your name." });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  if (!isValidPassword(password))
    return res.status(400).json({ error: "Password must be at least 6 characters." });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "An account with this email already exists." });

  const id = uuid();
  const passwordHash = bcrypt.hashSync(password, 10);
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, avatar_color) VALUES (?, ?, ?, ?, ?)`
  ).run(id, name.trim(), email.toLowerCase(), passwordHash, color);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  const token = signToken(id);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: "Please enter a valid email and password." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: "Incorrect email or password." });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Incorrect email or password." });

  const token = signToken(user.id);
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser({ ...req.user, avatar_color: req.user.avatar_color }) });
});

router.put("/me", requireAuth, (req, res) => {
  const { name, bio } = req.body || {};
  db.prepare("UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio) WHERE id = ?").run(
    name && name.trim() ? name.trim() : null,
    typeof bio === "string" ? bio : null,
    req.user.id
  );
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(user) });
});

module.exports = router;
