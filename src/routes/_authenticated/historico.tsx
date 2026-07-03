import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, History, Loader2, ShieldCheck, AlertTriangle, Download, Eye, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatDateTime, formatMZN, formatDate, mzLocalToISO } from "@/lib/format";
import { exportTablePDF } from "@/lib/pdf-export";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — PharmaSys" }] }),
  component: HistoricoPage,
});

type ReconcileIssue = { kind: string; id: string; name?: string; receipt?: string; batch_number?: string; stored?: number; computed?: number; diff?: number };
type ReconcileResult = { checked_at: string; ok: boolean; issues: ReconcileIssue[] };

// Local RPC helper (Electron IPC-backed rpc endpoints not typed in Supabase types)
const rpc = supabase.rpc as unknown as <T = unknown>(n: string, args?: Record<string, unknown>) => Promise<{ data: T; error: { message: string } | null }>;

function HistoricoPage() {
  const qc = useQueryClient();
  const [txnOpen, setTxnOpen] = useState<string | null>(null);

  // Audit filters
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fEntity, setFEntity] = useState<string>("all");
  const [fAction, setFAction] = useState<string>("all");
  const [onlyDiv, setOnlyDiv] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const [moves, sales] = await Promise.all([
        supabase.from("stock_movements").select("id, type, quantity, reason, created_at, txn_id, products(name)").order("created_at", { ascending: false }).limit(80),
        supabase.from("sales").select("id, receipt_number, sale_number, total, status, created_at, txn_id").order("created_at", { ascending: false }).limit(30),
      ]);
      if (moves.error) throw moves.error;
      if (sales.error) throw sales.error;
      return { moves: moves.data ?? [], sales: sales.data ?? [] };
    },
  });

  const auditQuery = useQuery({
    queryKey: ["audit", fFrom, fTo, fEntity, fAction, onlyDiv],
    queryFn: async () => {
      const { data, error } = await rpc<Array<{ id: string; created_at: string; entity: string; action: string; entity_id: string | null; txn_id: string | null; details: string | null; user_name: string | null }>>("audit_export", {
        // Limites convertidos do fuso Africa/Maputo (UTC+2) para ISO/UTC.
        from: fFrom ? mzLocalToISO(fFrom, 0, 0, 0) : undefined,
        to: fTo ? mzLocalToISO(fTo, 23, 59, 59) : undefined,
        entity: fEntity === "all" ? undefined : fEntity,
        action: fAction === "all" ? undefined : fAction,
        only_divergent: onlyDiv,
      });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const reconcile = useMutation({
    mutationFn: async () => {
      const { data, error } = await rpc<ReconcileResult>("reconcile");
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (r) => {
      qc.setQueryData(["reconcile-last"], r);
      if (r.ok) toast.success("Reconciliação OK — sem divergências");
      else toast.error(`Reconciliação encontrou ${r.issues.length} divergência(s)`);
    },
    onError: (e: Error) => toast.error("Falha na reconciliação", { description: e.message }),
  });
  const lastRecon = qc.getQueryData<ReconcileResult>(["reconcile-last"]);

  const entities = useMemo(() => Array.from(new Set((auditQuery.data ?? []).map((r) => r.entity).filter(Boolean))).sort(), [auditQuery.data]);
  const actions = useMemo(() => Array.from(new Set((auditQuery.data ?? []).map((r) => r.action).filter(Boolean))).sort(), [auditQuery.data]);

  function exportCSV() {
    const rows = auditQuery.data ?? [];
    if (rows.length === 0) { toast.info("Nada para exportar"); return; }
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Data", "Utilizador", "Entidade", "Ação", "Entity ID", "Txn", "Detalhes"];
    const lines = [header.join(";")];
    for (const r of rows) lines.push([formatDateTime(r.created_at), r.user_name ?? "", r.entity, r.action, r.entity_id ?? "", r.txn_id ?? "", r.details ?? ""].map(esc).join(";"));
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `auditoria-${formatDate(new Date())}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const rows = auditQuery.data ?? [];
    if (rows.length === 0) { toast.info("Nada para exportar"); return; }
    const filterParts: string[] = [];
    if (fFrom) filterParts.push(`De ${fFrom}`);
    if (fTo) filterParts.push(`Até ${fTo}`);
    if (fEntity !== "all") filterParts.push(`Entidade: ${fEntity}`);
    if (fAction !== "all") filterParts.push(`Ação: ${fAction}`);
    if (onlyDiv) filterParts.push("Apenas divergentes");
    exportTablePDF({
      title: "Auditoria — PharmaSys",
      filename: `auditoria-${formatDate(new Date())}`,
      subtitle: filterParts.length ? `Filtros: ${filterParts.join(" · ")}` : "Sem filtros aplicados",
      head: ["Data", "Utilizador", "Entidade", "Ação", "Entity ID", "Txn", "Detalhes"],
      body: rows.map((r) => [
        formatDateTime(r.created_at),
        r.user_name ?? "",
        r.entity,
        r.action,
        r.entity_id ?? "",
        r.txn_id ? String(r.txn_id).slice(0, 8) : "",
        r.details ?? "",
      ]),
      footerNote: `${rows.length} registo(s)`,
    });
  }



  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Reconciliação e integridade</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => reconcile.mutate()} disabled={reconcile.isPending}>
            {reconcile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar agora"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!lastRecon && <p className="text-muted-foreground">Corre uma verificação para confirmar que saldos, lotes e totais de venda batem certo com os movimentos gravados.</p>}
          {lastRecon?.ok && (
            <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Tudo íntegro — verificado em {formatDateTime(lastRecon.checked_at)}.</div>
          )}
          {lastRecon && !lastRecon.ok && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /> {lastRecon.issues.length} divergência(s) — {formatDateTime(lastRecon.checked_at)}</div>
              <ul className="ml-4 list-disc space-y-1 text-xs">
                {lastRecon.issues.slice(0, 10).map((i, idx) => (
                  <li key={idx}><b>{i.kind}</b> {i.name ?? i.receipt ?? i.batch_number ?? i.id}: gravado {i.stored} vs calculado {i.computed}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Vendas recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Recibo</TableHead><TableHead>Quando</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data?.sales.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm font-medium">{s.receipt_number ?? `#${s.sale_number}`}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(s.created_at)}</TableCell>
                  <TableCell className="text-right">{formatMZN(Number(s.total))}</TableCell>
                  <TableCell>{s.status === "cancelled" ? <Badge variant="destructive">Anulada</Badge> : <Badge variant="secondary">Concluída</Badge>}</TableCell>
                  <TableCell>{s.txn_id && <Button size="icon" variant="ghost" onClick={() => setTxnOpen(s.txn_id)}><Eye className="h-4 w-4" /></Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Movimentos de estoque</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead>Txn</TableHead><TableHead>Quando</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.moves.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{m.products?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant={m.type === "in" ? "default" : "secondary"}>{m.type === "in" ? "Entrada" : m.type === "out" ? "Saída" : m.type}</Badge></TableCell>
                    <TableCell className="text-right">{m.quantity}</TableCell>
                    <TableCell>{m.txn_id ? <button onClick={() => setTxnOpen(m.txn_id)} className="font-mono text-[10px] text-primary hover:underline">{String(m.txn_id).slice(0,8)}</button> : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(m.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Logs de auditoria</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportCSV} disabled={!auditQuery.data?.length}><Download className="mr-2 h-4 w-4" /> CSV</Button>
                <Button size="sm" variant="outline" onClick={exportPDF} disabled={!auditQuery.data?.length}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <div><Label className="text-[10px]">De</Label><Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="h-8" /></div>
              <div><Label className="text-[10px]">Até</Label><Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="h-8" /></div>
              <div>
                <Label className="text-[10px]">Entidade</Label>
                <Select value={fEntity} onValueChange={setFEntity}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Ação</Label>
                <Select value={fAction} onValueChange={setFAction}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Switch checked={onlyDiv} onCheckedChange={setOnlyDiv} id="only-div" />
              <Label htmlFor="only-div" className="text-xs">Apenas com divergência (reconciliação)</Label>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Entidade</TableHead><TableHead>Ação</TableHead><TableHead>Utilizador</TableHead><TableHead>Txn</TableHead><TableHead>Quando</TableHead></TableRow></TableHeader>
              <TableBody>
                {auditQuery.isLoading ? (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></TableCell></TableRow>
                ) : (auditQuery.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Sem registos.</TableCell></TableRow>
                ) : (auditQuery.data ?? []).slice(0, 100).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{l.entity}</TableCell>
                    <TableCell className="text-sm">{l.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.user_name ?? "—"}</TableCell>
                    <TableCell>{l.txn_id ? <button onClick={() => setTxnOpen(l.txn_id!)} className="font-mono text-[10px] text-primary hover:underline">{String(l.txn_id).slice(0,8)}</button> : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TxnDetailDialog txnId={txnOpen} onClose={() => setTxnOpen(null)} />
    </div>
  );
}

type TxnDetail = {
  txn_id: string;
  sale: any;
  items: any[];
  movements: any[];
  account_movements: any[];
  batches: any[];
  logs: any[];
};

function TxnDetailDialog({ txnId, onClose }: { txnId: string | null; onClose: () => void }) {
  const q = useQuery({
    queryKey: ["txn-detail", txnId],
    enabled: !!txnId,
    queryFn: async () => {
      const { data, error } = await rpc<TxnDetail>("txn_detail", { txn_id: txnId });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return (
    <Dialog open={!!txnId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-mono text-sm">Transação {txnId?.slice(0, 8)}…</DialogTitle></DialogHeader>
        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !q.data ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sem dados.</p>
        ) : (
          <div className="space-y-4 text-sm">
            {q.data.sale && (
              <Section title="Venda">
                <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                  <Field label="Recibo" value={q.data.sale.receipt_number} />
                  <Field label="Utilizador" value={q.data.sale.user_name} />
                  <Field label="Conta" value={q.data.sale.account_name} />
                  <Field label="Total" value={formatMZN(Number(q.data.sale.total))} />
                  <Field label="Pagamento" value={q.data.sale.payment_method} />
                  <Field label="Estado" value={q.data.sale.status} />
                  <Field label="Quando" value={formatDateTime(q.data.sale.created_at)} />
                </div>
              </Section>
            )}
            {q.data.items.length > 0 && (
              <Section title={`Itens (${q.data.items.length})`}>
                <MiniTable head={["Produto", "Lote", "Qtd", "Preço", "Total"]} rows={q.data.items.map((i) => [i.product_name, i.batch_number ?? "—", i.quantity, formatMZN(Number(i.unit_price)), formatMZN(Number(i.total))])} />
              </Section>
            )}
            {q.data.batches.length > 0 && (
              <Section title={`Lotes criados (${q.data.batches.length})`}>
                <MiniTable head={["Produto", "Lote", "Validade", "Qtd", "Custo", "Fornecedor"]} rows={q.data.batches.map((b) => [b.product_name, b.batch_number, formatDate(b.expiry_date), b.quantity, formatMZN(Number(b.cost_price)), b.supplier_name ?? "—"])} />
              </Section>
            )}
            {q.data.movements.length > 0 && (
              <Section title={`Movimentos de estoque (${q.data.movements.length})`}>
                <MiniTable head={["Produto", "Lote", "Tipo", "Qtd", "Motivo"]} rows={q.data.movements.map((m) => [m.product_name, m.batch_number ?? "—", m.type, m.quantity, m.reason ?? "—"])} />
              </Section>
            )}
            {q.data.account_movements.length > 0 && (
              <Section title={`Movimentos de conta (${q.data.account_movements.length})`}>
                <MiniTable head={["Conta", "Tipo", "Valor", "Motivo"]} rows={q.data.account_movements.map((a) => [a.account_name, a.type, formatMZN(Number(a.amount)), a.reason ?? "—"])} />
              </Section>
            )}
            {q.data.logs.length > 0 && (
              <Section title={`Auditoria (${q.data.logs.length})`}>
                <MiniTable head={["Ação", "Entidade", "Utilizador", "Detalhes"]} rows={q.data.logs.map((l) => [l.action, l.entity, l.user_name ?? "—", l.details ?? ""])} />
              </Section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-[10px] uppercase text-muted-foreground">{label}</div><div>{value ?? "—"}</div></div>;
}
function MiniTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <Table>
      <TableHeader><TableRow>{head.map((h) => <TableHead key={h} className="text-xs">{h}</TableHead>)}</TableRow></TableHeader>
      <TableBody>
        {rows.map((r, i) => <TableRow key={i}>{r.map((c, j) => <TableCell key={j} className="text-xs">{c}</TableCell>)}</TableRow>)}
      </TableBody>
    </Table>
  );
}
