import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "56px auto 0" }}>
      <div className="glass-panel-strong" style={{ padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontSize: "2.2rem" }}>🍿</span>
          <h2 style={{ marginTop: 10 }}>Join KeReview</h2>
          <p className="text-muted" style={{ margin: 0 }}>
            Track, rate and talk about Kenyan cinema with fellow fans.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input
              className="clay-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wanjiru Mwangi"
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              className="clay-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              className="clay-input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          {error && <div className="error-banner">{error}</div>}
          <button className="clay-btn" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20 }} className="text-muted">
          Already have an account? <Link to="/login" style={{ color: "var(--ke-gold)", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "0.85rem", marginBottom: 6, color: "var(--text-muted)" };
