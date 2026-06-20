import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/aprovacoes")({
  head: () => ({ meta: [{ title: "Aprovações — PharmaSys" }] }),
  component: () => <RoleGate allow={["admin"]}><AprovacoesPage /></RoleGate>,
});

type Req = {
  id: string; entity: string; entity_id: string; entity_label: string | null;
  reason: string; status: "pending" | "approved" | "rejected";
  requested_by: string; reviewed_by: string | null; reviewed_at: string | null;
  review_reason: string | null; created_at: string;
  requester?: { full_name: string | null; email: string | null } | null;
};

const ENTITY_LABEL: Record<string, string> = {
  sale: "Venda (anulação)", product: "Produto", supplier: "Fornecedor", customer: "Cliente",
};

function AprovacoesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [target, setTarget] = useState<Req | null>(null);
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [reviewReason, setReviewReason] = useState("");

  const { data = [], isLoading } = useQuery<Req[]>({
    queryKey: ["deletion-requests", tab],
    queryFn: async () => {
      const q = supabase
        .from("deletion_requests")
        .select("id, entity, entity_id, entity_label, reason, status, requested_by, reviewed_by, reviewed_at, review_reason, created_at, requester:profiles!deletion_requests_requested_by_fkey(full_name, email)")
        .order("created_at", { ascending: false });
      const { data, error } = tab === "pending"
        ? await q.eq("status", "pending")
        : await q.neq("status", "pending").limit(50);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const reviewMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("review_deletion", {
        p_id: target!.id, p_approve: mode === "approve", p_reason: reviewReason ?? "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(mode === "approve" ? "Pedido aprovado e executado" : "Pedido rejeitado");
      setTarget(null); setReviewReason("");
      qc.invalidateQueries({ queryKey: ["deletion-requests"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Aprovações de eliminação</CardTitle>
          <p className="text-sm text-muted-foreground">Pedidos enviados pela equipa que requerem aprovação do administrador.</p>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : data.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Sem pedidos.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Motivo</TableHead>
                      {tab === "history" && <TableHead>Estado</TableHead>}
                      {tab === "pending" && <TableHead className="text-right">Ação</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs">{formatDateTime(r.created_at)}</TableCell>
                        <TableCell><Badge variant="outline">{ENTITY_LABEL[r.entity] ?? r.entity}</Badge></TableCell>
                        <TableCell className="text-sm">{r.entity_label ?? r.entity_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-xs">{r.requester?.full_name ?? r.requester?.email ?? "—"}</TableCell>
                        <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground" title={r.reason}>{r.reason}</TableCell>
                        {tab === "history" && (
                          <TableCell>
                            {r.status === "approved"
                              ? <Badge className="bg-emerald-600/15 text-emerald-700">Aprovado</Badge>
                              : <Badge variant="destructive">Rejeitado</Badge>}
                          </TableCell>
                        )}
                        {tab === "pending" && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" className="text-emerald-700"
                                onClick={() => { setTarget(r); setMode("approve"); }}>
                                <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive"
                                onClick={() => { setTarget(r); setMode("reject"); }}>
                                <XCircle className="mr-1 h-4 w-4" /> Rejeitar
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!target} onOpenChange={(o) => { if (!o) { setTarget(null); setReviewReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "approve" ? "Aprovar eliminação" : "Rejeitar pedido"}</DialogTitle>
          </DialogHeader>
          {target && (
            <div className="space-y-3 text-sm">
              <p>
                <strong>{ENTITY_LABEL[target.entity] ?? target.entity}:</strong> {target.entity_label}
              </p>
              <p className="text-muted-foreground"><strong>Motivo:</strong> {target.reason}</p>
              <div>
                <label className="text-sm font-medium">Comentário ({mode === "reject" ? "obrigatório" : "opcional"})</label>
                <Textarea rows={3} value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} />
              </div>
              {mode === "approve" && (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                  Ao aprovar, a ação correspondente é executada imediatamente (vendas → anuladas; produtos/fornecedores → desativados; clientes → eliminados).
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>Cancelar</Button>
            <Button
              variant={mode === "approve" ? "default" : "destructive"}
              onClick={() => reviewMut.mutate()}
              disabled={reviewMut.isPending || (mode === "reject" && !reviewReason.trim())}
            >
              {reviewMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
