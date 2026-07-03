import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, History, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDateTime, formatMZN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — PharmaSys" }] }),
  component: HistoricoPage,
});

type SaleRow = {
  id: string; receipt_number: string | null; sale_number: number;
  total: number; status: string; created_at: string;
};

type ReconcileIssue = { kind: string; id: string; name?: string; receipt?: string; batch_number?: string; stored?: number; computed?: number; diff?: number };
type ReconcileResult = { checked_at: string; ok: boolean; issues: ReconcileIssue[] };

function HistoricoPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const [moves, logs, sales] = await Promise.all([
        supabase.from("stock_movements").select("id, type, quantity, reason, created_at, txn_id, products(name)").order("created_at", { ascending: false }).limit(50),
        supabase.from("audit_logs").select("id, entity, action, created_at, details, txn_id").order("created_at", { ascending: false }).limit(50),
        supabase.from("sales").select("id, receipt_number, sale_number, total, status, created_at").order("created_at", { ascending: false }).limit(30),
      ]);
      if (moves.error) throw moves.error;
      if (logs.error) throw logs.error;
      if (sales.error) throw sales.error;
      return { moves: moves.data ?? [], logs: logs.data ?? [], sales: (sales.data ?? []) as SaleRow[] };
    },
  });

  const reconcile = useMutation({
    mutationFn: async () => {
      // reconcile is a local (Electron IPC) RPC not present in Supabase types.
      const { data, error } = await (supabase.rpc as unknown as (n: string) => Promise<{ data: unknown; error: { message: string } | null }>)("reconcile");
      if (error) throw error;
      return data as ReconcileResult;
    },
    onSuccess: (r) => {
      qc.setQueryData(["reconcile-last"], r);
      if (r.ok) toast.success("Reconciliação OK — sem divergências");
      else toast.error(`Reconciliação encontrou ${r.issues.length} divergência(s)`);
    },
    onError: (e: Error) => toast.error("Falha na reconciliação", { description: e.message }),
  });
  const lastRecon = qc.getQueryData<ReconcileResult>(["reconcile-last"]);


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
                  <li key={idx}>
                    <b>{i.kind}</b> {i.name ?? i.receipt ?? i.batch_number ?? i.id}: gravado {i.stored} vs calculado {i.computed}
                  </li>
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
            </TableRow></TableHeader>
            <TableBody>
              {data?.sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm font-medium">{s.receipt_number ?? `#${s.sale_number}`}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(s.created_at)}</TableCell>
                  <TableCell className="text-right">{formatMZN(Number(s.total))}</TableCell>
                  <TableCell>
                    {s.status === "cancelled"
                      ? <Badge variant="destructive">Anulada</Badge>
                      : <Badge variant="secondary">Concluída</Badge>}
                  </TableCell>
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
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{m.txn_id ? String(m.txn_id).slice(0,8) : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(m.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Logs de auditoria</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Entidade</TableHead><TableHead>Ação</TableHead><TableHead>Txn</TableHead><TableHead>Quando</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.logs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">Sem registos.</TableCell></TableRow>
                ) : data?.logs.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{l.entity}</TableCell>
                    <TableCell className="text-sm">{l.action}</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{l.txn_id ? String(l.txn_id).slice(0,8) : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
