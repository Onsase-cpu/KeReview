import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/");
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
          <span style={{ fontSize: "2.2rem" }}>🎬</span>
          <h2 style={{ marginTop: 10 }}>Karibu tena!</h2>
          <p className="text-muted" style={{ margin: 0 }}>Log in to rate, review and track Kenyan movies.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <div className="error-banner">{error}</div>}
          <button className="clay-btn" type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20 }} className="text-muted">
          New to KeReview? <Link to="/signup" style={{ color: "var(--ke-gold)", fontWeight: 600 }}>Create an account</Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 6, fontSize: "0.78rem" }} className="text-muted">
          Demo admin: admin@kereview.co.ke / ChangeMe123!
        </p>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "0.85rem", marginBottom: 6, color: "var(--text-muted)" };
