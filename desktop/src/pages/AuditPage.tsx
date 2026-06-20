import { useEffect, useState } from "react";
import { api, unwrap } from "../lib/api";

export function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.audit
      .list(300)
      .then((r) => {
        if (r.error) setError(r.error.message);
        else setRows(r.data || []);
      });
  }, []);

  return (
    <>
      <h1>Histórico de auditoria</h1>
      <p className="subtitle">Acções relevantes registadas no sistema.</p>
      {error && <div className="error">{error}</div>}
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Utilizador</th>
              <th>Entidade</th>
              <th>Acção</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at + "Z").toLocaleString("pt-PT")}</td>
                <td>{r.user_name || r.user_email || "—"}</td>
                <td>{r.entity}</td>
                <td>{r.action}</td>
                <td style={{ fontSize: 12, color: "var(--muted)" }}>{r.details || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                  Sem registos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
