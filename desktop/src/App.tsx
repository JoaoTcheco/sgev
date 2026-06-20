import { useEffect, useState } from "react";
import { api, unwrap, type SessionUser } from "./lib/api";
import { AuthShell } from "./pages/AuthShell";
import { Dashboard } from "./pages/Dashboard";
import { UsersPage } from "./pages/UsersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuditPage } from "./pages/AuditPage";
import { AccountPage } from "./pages/AccountPage";

type Tab = "dashboard" | "users" | "settings" | "audit" | "account";

export function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    api.auth
      .currentUser()
      .then((r) => setUser(r.data ?? null))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="auth-shell">
        <div className="auth-card">A carregar…</div>
      </div>
    );

  if (!user) return <AuthShell onAuth={setUser} />;

  const isAdmin = user.roles.includes("admin");

  async function handleLogout() {
    await unwrap(api.auth.logout());
    setUser(null);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">PharmaSys</div>
        <a
          className={tab === "dashboard" ? "active" : ""}
          onClick={() => setTab("dashboard")}
          href="#"
        >
          Painel
        </a>
        {isAdmin && (
          <a
            className={tab === "users" ? "active" : ""}
            onClick={() => setTab("users")}
            href="#"
          >
            Utilizadores
          </a>
        )}
        {isAdmin && (
          <a
            className={tab === "settings" ? "active" : ""}
            onClick={() => setTab("settings")}
            href="#"
          >
            Configurações
          </a>
        )}
        {isAdmin && (
          <a
            className={tab === "audit" ? "active" : ""}
            onClick={() => setTab("audit")}
            href="#"
          >
            Histórico
          </a>
        )}
        <a
          className={tab === "account" ? "active" : ""}
          onClick={() => setTab("account")}
          href="#"
        >
          A minha conta
        </a>
        <div className="user">
          <div style={{ fontWeight: 600, color: "var(--text)" }}>
            {user.full_name || user.email}
          </div>
          <div>{user.roles.join(", ")}</div>
          <button
            className="ghost"
            style={{ marginTop: 8, width: "100%" }}
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="main">
        {tab === "dashboard" && <Dashboard user={user} />}
        {tab === "users" && isAdmin && <UsersPage me={user} />}
        {tab === "settings" && isAdmin && <SettingsPage />}
        {tab === "audit" && isAdmin && <AuditPage />}
        {tab === "account" && (
          <AccountPage user={user} onUpdated={setUser} />
        )}
      </main>
    </div>
  );
}
