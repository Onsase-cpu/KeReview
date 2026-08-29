import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div
        className="page-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "1.25rem",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(150deg, var(--ke-green-light), var(--ke-green))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "3px 3px 8px rgba(0,0,0,0.35)",
            }}
          >
            🎬
          </span>
          Ke<span style={{ color: "var(--ke-gold)" }}>Review</span>
        </Link>

        <button
          className="clay-btn ghost sm nav-toggle"
          style={{ display: "none" }}
          onClick={() => setMenuOpen((v) => !v)}
        >
          Menu
        </button>

        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NavLink to="/">Browse</NavLink>
          {user && <NavLink to="/watchlist">Watchlist</NavLink>}
          {user && <NavLink to="/my-list">My List</NavLink>}
          {user?.isAdmin && <NavLink to="/discover">AI Discover</NavLink>}

          {user ? (
            <>
              <Link to="/profile" style={{ marginLeft: 6 }}>
                <div
                  title={user.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: user.avatarColor || "var(--ke-green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#fff",
                    boxShadow: "2px 2px 6px rgba(0,0,0,0.35)",
                  }}
                >
                  {user.name?.[0]?.toUpperCase() || "K"}
                </div>
              </Link>
              <button className="clay-btn ghost sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="clay-btn ghost sm">
                Log in
              </Link>
              <Link to="/signup" className="clay-btn sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 780px) {
          .nav-links a span.label, .nav-links a { font-size: 0.85rem; }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} className="clay-btn ghost sm">
      {children}
    </Link>
  );
}
