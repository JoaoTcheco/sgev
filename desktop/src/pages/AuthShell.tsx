import { useEffect, useState } from "react";
import { api, unwrap, type SessionUser } from "../lib/api";

export function AuthShell({ onAuth }: { onAuth: (u: SessionUser) => void }) {
  const [mode, setMode] = useState<"login" | "bootstrap" | "loading">("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.auth.needsBootstrap().then((r) => {
      setMode(r.data?.needsBootstrap ? "bootstrap" : "login");
    });
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      if (mode === "bootstrap") {
        const user = await unwrap(
          api.auth.bootstrap({
            email: String(fd.get("email")),
            password: String(fd.get("password")),
            fullName: String(fd.get("fullName")),
          }),
        );
        onAuth(user);
      } else {
        const user = await unwrap(
          api.auth.login(
            String(fd.get("email")),
            String(fd.get("password")),
          ),
        );
        onAuth(user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (mode === "loading")
    return (
      <div className="auth-shell">
        <div className="auth-card">A carregar…</div>
      </div>
    );

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>PharmaSys</h1>
        <p className="subtitle">
          {mode === "bootstrap"
            ? "Crie a conta de administrador para começar"
            : "Entre na sua conta"}
        </p>
        <form onSubmit={submit} className="stack">
          {mode === "bootstrap" && (
            <div>
              <label>Nome completo</label>
              <input name="fullName" required />
            </div>
          )}
          <div>
            <label>Email</label>
            <input name="email" type="email" required autoFocus />
          </div>
          <div>
            <label>Password {mode === "bootstrap" && "(min. 6 caracteres)"}</label>
            <input name="password" type="password" required minLength={6} />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={busy}>
            {busy
              ? "A processar…"
              : mode === "bootstrap"
                ? "Criar administrador"
                : "Entrar"}
          </button>
        </form>
        <p
          className="subtitle"
          style={{ marginTop: 20, textAlign: "center", fontSize: 12 }}
        >
          Os dados são guardados localmente neste computador.
        </p>
      </div>
    </div>
  );
}
