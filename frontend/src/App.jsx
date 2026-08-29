import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import MovieDetail from "./pages/MovieDetail.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import MyList from "./pages/MyList.jsx";
import Discover from "./pages/Discover.jsx";
import Profile from "./pages/Profile.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function PageLoader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/movies/:idOrSlug" element={<MovieDetail />} />
          <Route
            path="/watchlist"
            element={
              <RequireAuth>
                <Watchlist />
              </RequireAuth>
            }
          />
          <Route
            path="/my-list"
            element={
              <RequireAuth>
                <MyList />
              </RequireAuth>
            }
          />
          <Route
            path="/discover"
            element={
              <RequireAuth>
                <Discover />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="empty-state">
      <span className="emoji">🧭</span>
      <h2>Page not found</h2>
      <p>That page doesn't exist. Head back to the KeReview homepage.</p>
    </div>
  );
}

function Footer() {
  return (
    <footer
      style={{
        textAlign: "center",
        padding: "24px 16px",
        color: "var(--text-muted)",
        fontSize: "0.85rem",
      }}
    >
      🎬 KeReview — Made for the love of Kenyan cinema. Habari ya sinema leo?
    </footer>
  );
}
