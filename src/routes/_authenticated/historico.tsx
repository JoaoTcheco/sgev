import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Loader2, Ban, Loader as LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime, formatMZN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — PharmaSys" }] }),
  component: HistoricoPage,
});

type SaleRow = {
  id: string; receipt_number: string | null; sale_number: number;
  total: number; status: string; created_at: string;
};

function HistoricoPage() {
  const qc = useQueryClient();
  const [requestSale, setRequestSale] = useState<SaleRow | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const [moves, logs, sales, pending] = await Promise.all([
        supabase.from("stock_movements").select("id, type, quantity, reason, created_at, products(name)").order("created_at", { ascending: false }).limit(50),
        supabase.from("audit_logs").select("id, entity, action, created_at, details").order("created_at", { ascending: false }).limit(50),
        supabase.from("sales").select("id, receipt_number, sale_number, total, status, created_at").order("created_at", { ascending: false }).limit(30),
        supabase.from("deletion_requests").select("entity_id").eq("entity", "sale").eq("status", "pending"),
      ]);
      if (moves.error) throw moves.error;
      if (logs.error) throw logs.error;
      if (sales.error) throw sales.error;
      if (pending.error) throw pending.error;
      const pendingIds = new Set((pending.data ?? []).map((p: any) => p.entity_id));
      return { moves: moves.data ?? [], logs: logs.data ?? [], sales: (sales.data ?? []) as SaleRow[], pendingIds };
    },
  });

  const requestMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("request_deletion", {
        p_entity: "sale", p_entity_id: requestSale!.id, p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido de anulação enviado para aprovação");
      setRequestSale(null); setReason("");
      qc.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Vendas recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Recibo</TableHead><TableHead>Quando</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data?.sales.map((s) => {
                const isPending = data.pendingIds.has(s.id);
                const isCancelled = s.status === "cancelled";
                return (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm font-medium">{s.receipt_number ?? `#${s.sale_number}`}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(s.created_at)}</TableCell>
                    <TableCell className="text-right">{formatMZN(Number(s.total))}</TableCell>
                    <TableCell>
                      {isCancelled ? <Badge variant="destructive">Anulada</Badge> : <Badge variant="secondary">Concluída</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {isCancelled ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : isPending ? (
                        <Badge variant="outline" className="gap-1"><LoaderIcon className="h-3 w-3 animate-spin" /> aguarda admin</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setRequestSale(s)}>
                          <Ban className="mr-1 h-4 w-4" /> Solicitar anulação
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Movimentos de estoque</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead>Quando</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.moves.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{m.products?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant={m.type === "in" ? "default" : "secondary"}>{m.type === "in" ? "Entrada" : m.type === "out" ? "Saída" : m.type}</Badge></TableCell>
                    <TableCell className="text-right">{m.quantity}</TableCell>
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
              <TableHeader><TableRow><TableHead>Entidade</TableHead><TableHead>Ação</TableHead><TableHead>Quando</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.logs.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">Sem registos.</TableCell></TableRow>
                ) : data?.logs.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{l.entity}</TableCell>
                    <TableCell className="text-sm">{l.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!requestSale} onOpenChange={(o) => { if (!o) { setRequestSale(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Solicitar anulação de venda</DialogTitle></DialogHeader>
          {requestSale && (
            <div className="space-y-3 text-sm">
              <p><strong>Recibo:</strong> {requestSale.receipt_number ?? `#${requestSale.sale_number}`} · {formatMZN(Number(requestSale.total))}</p>
              <div>
                <label className="text-sm font-medium">Motivo (obrigatório)</label>
                <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cliente desistiu, erro de digitação…" />
              </div>
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                O pedido será enviado para aprovação do administrador.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRequestSale(null)}>Cancelar</Button>
            <Button onClick={() => requestMut.mutate()} disabled={requestMut.isPending || !reason.trim()}>
              {requestMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
