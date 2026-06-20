import { useEffect, useState } from "react";
import { api, unwrap } from "../lib/api";

export function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  useEffect(() => {
    api.settings.get().then((r) => setData(r.data));
  }, []);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      address: String(fd.get("address") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      tax_id: String(fd.get("tax_id") || ""),
      currency: String(fd.get("currency") || "MZN"),
      receipt_footer: String(fd.get("receipt_footer") || ""),
      low_stock_threshold: Number(fd.get("low_stock_threshold") || 10),
      expiry_warning_days: Number(fd.get("expiry_warning_days") || 30),
    };
    try {
      const updated = await unwrap(api.settings.save(payload));
      setData(updated);
      setMsg({ type: "ok", text: "Configurações guardadas." });
    } catch (e: any) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <div>A carregar…</div>;

  return (
    <>
      <h1>Configurações</h1>
      <p className="subtitle">Dados da farmácia e parâmetros gerais.</p>

      <form onSubmit={save} className="card stack">
        <div className="row" style={{ gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label>Nome da farmácia</label>
            <input name="name" defaultValue={data.name || ""} />
          </div>
          <div style={{ flex: 1 }}>
            <label>NUIT / Tax ID</label>
            <input name="tax_id" defaultValue={data.tax_id || ""} />
          </div>
        </div>
        <div>
          <label>Morada</label>
          <input name="address" defaultValue={data.address || ""} />
        </div>
        <div className="row" style={{ gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label>Telefone</label>
            <input name="phone" defaultValue={data.phone || ""} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Email</label>
            <input name="email" type="email" defaultValue={data.email || ""} />
          </div>
          <div style={{ width: 120 }}>
            <label>Moeda</label>
            <input name="currency" defaultValue={data.currency || "MZN"} />
          </div>
        </div>
        <div>
          <label>Rodapé do recibo</label>
          <textarea name="receipt_footer" rows={2} defaultValue={data.receipt_footer || ""} />
        </div>
        <div className="row" style={{ gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label>Limite para alerta de stock baixo</label>
            <input
              name="low_stock_threshold"
              type="number"
              defaultValue={data.low_stock_threshold || 10}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Aviso de validade (dias)</label>
            <input
              name="expiry_warning_days"
              type="number"
              defaultValue={data.expiry_warning_days || 30}
            />
          </div>
        </div>
        {msg && <div className={msg.type === "ok" ? "success" : "error"}>{msg.text}</div>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="submit" disabled={busy}>
            {busy ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </form>
    </>
  );
}
