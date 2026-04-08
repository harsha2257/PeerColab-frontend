import { useAuth } from "../../context/AuthContext";

export default function AppShell({ title, subtitle, children }) {
  const { profile, signOut } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1 className="brand">PeerColab</h1>
          <p>{profile?.full_name}</p>
          <p style={{ textTransform: "capitalize", opacity: 0.8 }}>
            {profile?.role}
          </p>
        </div>

        <button className="primary-btn" onClick={signOut}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <div style={{ marginBottom: "24px" }}>
          <h2>{title}</h2>
          <p style={{ opacity: 0.8 }}>{subtitle}</p>
        </div>

        {children}
      </main>
    </div>
  );
}