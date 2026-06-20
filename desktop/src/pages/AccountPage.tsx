import { useState } from "react";
import { api, unwrap, type SessionUser } from "../lib/api";

export function AccountPage({
  user,
  onUpdated,
}: {
  user: SessionUser;
  onUpdated: (u: SessionUser) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setMsg(null);
    try {
      await unwrap(
        api.auth.changePassword(
          String(fd.get("old")),
          String(fd.get("new")),
        ),
      );
      setMsg({ type: "ok", text: "Password actualizada." });
      e.currentTarget.reset();
    } catch (e: any) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>A minha conta</h1>
      <p className="subtitle">{user.email}</p>

      <div className="card" style={{ maxWidth: 500 }}>
        <h2 style={{ marginTop: 0 }}>Alterar password</h2>
        <form onSubmit={changePassword} className="stack">
          <div>
            <label>Password actual</label>
            <input name="old" type="password" required />
          </div>
          <div>
            <label>Nova password (min. 6)</label>
            <input name="new" type="password" required minLength={6} />
          </div>
          {msg && <div className={msg.type === "ok" ? "success" : "error"}>{msg.text}</div>}
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="submit" disabled={busy}>
              {busy ? "A guardar…" : "Alterar"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
