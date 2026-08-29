import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const { user: updated } = await api.updateProfile({ name, bio });
      updateUser(updated);
      setMsg("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            background: user.avatarColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: 700,
            color: "#fff",
            margin: "0 auto 14px",
            boxShadow: "6px 6px 16px rgba(0,0,0,0.4)",
          }}
        >
          {user.name?.[0]?.toUpperCase()}
        </div>
        <h2>{user.name}</h2>
        <p className="text-muted">{user.email}</p>
        {user.isAdmin && <span className="badge gold" style={{ marginTop: 6 }}>Admin</span>}
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6 }} className="text-muted">
            Display name
          </label>
          <input className="clay-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6 }} className="text-muted">
            Bio
          </label>
          <textarea
            className="clay-textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other Kenyan movie fans about yourself…"
          />
        </div>
        {msg && <div className="success-banner">{msg}</div>}
        {error && <div className="error-banner">{error}</div>}
        <button className="clay-btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
