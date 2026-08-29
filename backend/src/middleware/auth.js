const jwt = require("jsonwebtoken");
const db = require("../db");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated. Please log in." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db
      .prepare("SELECT id, name, email, avatar_color, bio, is_admin FROM users WHERE id = ?")
      .get(payload.sub);
    if (!user) return res.status(401).json({ error: "User no longer exists." });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

// Attaches req.user if a valid token is present, but doesn't block the request otherwise.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db
      .prepare("SELECT id, name, email, avatar_color, bio, is_admin FROM users WHERE id = ?")
      .get(payload.sub);
    if (user) req.user = user;
  } catch (err) {
    /* ignore invalid token for optional auth */
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
