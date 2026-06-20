import type { SessionUser } from "../lib/api";

export function Dashboard({ user }: { user: SessionUser }) {
  return (
    <>
      <h1>Bem-vindo, {user.full_name || user.email}</h1>
      <p className="subtitle">PharmaSys Desktop — Fase 1</p>

      <div className="notice">
        Esta é a versão de fundação da app desktop. O login local e a gestão de
        utilizadores já funcionam. As páginas de produtos, vendas, estoque,
        relatórios e estatísticas estão a ser portadas nas próximas fases.
      </div>

      <div
        className="stack"
        style={{ gridTemplateColumns: "1fr 1fr 1fr", display: "grid", gap: 16 }}
      >
        <div className="card">
          <div className="subtitle" style={{ marginBottom: 4 }}>
            O seu perfil
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {user.roles.join(", ") || "Sem perfil"}
          </div>
        </div>
        <div className="card">
          <div className="subtitle" style={{ marginBottom: 4 }}>
            Email
          </div>
          <div style={{ fontSize: 16 }}>{user.email}</div>
        </div>
        <div className="card">
          <div className="subtitle" style={{ marginBottom: 4 }}>
            Armazenamento
          </div>
          <div style={{ fontSize: 16 }}>Local (SQLite)</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Funcionalidades disponíveis</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>✅ Login e logout local</li>
          <li>✅ Bootstrap do primeiro administrador</li>
          <li>✅ CRUD completo de utilizadores (apenas admin)</li>
          <li>✅ Alteração de perfis e activação/desactivação</li>
          <li>✅ Reset de password pelo administrador</li>
          <li>✅ Configurações da farmácia</li>
          <li>✅ Histórico de auditoria</li>
          <li>⏳ Produtos, lotes, fornecedores, clientes — em migração</li>
          <li>⏳ Vendas, turnos de caixa, recibos — em migração</li>
          <li>⏳ Relatórios e estatísticas — em migração</li>
        </ul>
      </div>
    </>
  );
}
