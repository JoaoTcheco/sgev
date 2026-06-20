import { useEffect, useState } from "react";
import { api, unwrap, type Role, type SessionUser } from "../lib/api";

export function UsersPage({ me }: { me: SessionUser }) {
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SessionUser | null>(null);
  const [resetting, setResetting] = useState<SessionUser | null>(null);

  async function load() {
    try {
      setUsers(await unwrap(api.users.list()));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(u: SessionUser, role: Role) {
    try {
      await unwrap(api.users.setRole(u.id, role));
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function toggleActive(u: SessionUser) {
    try {
      await unwrap(api.users.setActive(u.id, !u.active));
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function remove(u: SessionUser) {
    if (!confirm(`Eliminar ${u.email}? Esta acção é irreversível.`)) return;
    try {
      await unwrap(api.users.remove(u.id));
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <>
      <div className="row">
        <div style={{ flex: 1 }}>
          <h1>Utilizadores</h1>
          <p className="subtitle">Criar, editar e gerir contas locais.</p>
        </div>
        <button onClick={() => setShowCreate(true)}>+ Novo utilizador</button>
      </div>

      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acções</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const role = (u.roles[0] || "cashier") as Role;
              return (
                <tr key={u.id}>
                  <td>
                    {u.full_name || "—"}
                    {u.id === me.id && (
                      <span
                        className="badge"
                        style={{ marginLeft: 8, fontSize: 11 }}
                      >
                        você
                      </span>
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={role}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      style={{ width: 150 }}
                    >
                      <option value="admin">Administrador</option>
                      <option value="pharmacist">Farmacêutico</option>
                      <option value="cashier">Operador de caixa</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? "" : "inactive"}`}>
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="ghost"
                      onClick={() => setEditing(u)}
                      style={{ marginRight: 6 }}
                    >
                      Editar
                    </button>
                    <button
                      className="ghost"
                      onClick={() => setResetting(u)}
                      style={{ marginRight: 6 }}
                      disabled={u.id === me.id}
                    >
                      Reset password
                    </button>
                    <button
                      className="ghost"
                      onClick={() => toggleActive(u)}
                      style={{ marginRight: 6 }}
                      disabled={u.id === me.id}
                    >
                      {u.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="danger"
                      onClick={() => remove(u)}
                      disabled={u.id === me.id}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {resetting && (
        <ResetPasswordModal
          user={resetting}
          onClose={() => setResetting(null)}
          onDone={() => setResetting(null)}
        />
      )}
    </>
  );
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await unwrap(
        api.users.create({
          email: String(fd.get("email")),
          password: String(fd.get("password")),
          fullName: String(fd.get("fullName")),
          role: fd.get("role") as Role,
        }),
      );
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Novo utilizador</h2>
        <form onSubmit={submit} className="stack">
          <div>
            <label>Nome completo</label>
            <input name="fullName" required />
          </div>
          <div>
            <label>Email</label>
            <input name="email" type="email" required />
          </div>
          <div>
            <label>Password (min. 6)</label>
            <input name="password" type="password" required minLength={6} />
          </div>
          <div>
            <label>Perfil</label>
            <select name="role" defaultValue="cashier">
              <option value="admin">Administrador</option>
              <option value="pharmacist">Farmacêutico</option>
              <option value="cashier">Operador de caixa</option>
            </select>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "A criar…" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: SessionUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await unwrap(
        api.users.update({
          userId: user.id,
          fullName: String(fd.get("fullName")),
          email: String(fd.get("email")),
        }),
      );
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Editar utilizador</h2>
        <form onSubmit={submit} className="stack">
          <div>
            <label>Nome</label>
            <input
              name="fullName"
              defaultValue={user.full_name || ""}
              required
            />
          </div>
          <div>
            <label>Email</label>
            <input name="email" type="email" defaultValue={user.email} required />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "A guardar…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onDone,
}: {
  user: SessionUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await unwrap(
        api.users.resetPassword(user.id, String(fd.get("password"))),
      );
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Reset password — {user.email}</h2>
        {done ? (
          <>
            <div className="success">Password actualizada com sucesso.</div>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={onDone}>Fechar</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="stack">
            <div>
              <label>Nova password (min. 6)</label>
              <input name="password" type="password" required minLength={6} />
            </div>
            {error && <div className="error">{error}</div>}
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="ghost" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" disabled={busy}>
                {busy ? "A guardar…" : "Definir"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
