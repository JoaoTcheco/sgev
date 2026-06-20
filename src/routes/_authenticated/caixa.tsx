import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Loader2, Play, Square, ArrowDownCircle, ArrowUpCircle, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMZN, formatDateTime } from "@/lib/format";
import { useAuthUser } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/caixa")({
  head: () => ({ meta: [{ title: "Caixa — PharmaSys" }] }),
  component: CaixaPage,
});

type Session = {
  id: string; opened_at: string; closed_at: string | null;
  opening_amount: number; counted_amount: number | null;
  expected_amount: number | null; difference: number | null;
  notes: string | null; status: "open" | "closed";
};

function CaixaPage() {
  const { user } = useAuthUser();
  const qc = useQueryClient();
  const [openAmt, setOpenAmt] = useState("0");
  const [closeOpen, setCloseOpen] = useState(false);

  const sessions = useQuery<Session[]>({
    queryKey: ["my-cash-sessions"],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_sessions")
        .select("id, opened_at, closed_at, opening_amount, counted_amount, expected_amount, difference, notes, status")
        .eq("user_id", user!.id)
        .order("opened_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Session[];
    },
  });

  const active = sessions.data?.find((s) => s.status === "open") ?? null;

  const liveTotals = useQuery({
    queryKey: ["session-live", active?.id],
    enabled: !!active,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("total, payment_method, status")
        .eq("cash_session_id", active!.id)
        .eq("status", "completed");
      if (error) throw error;
      const cash = data.filter((s) => s.payment_method === "cash").reduce((a, b) => a + Number(b.total), 0);
      const other = data.filter((s) => s.payment_method !== "cash").reduce((a, b) => a + Number(b.total), 0);
      return { cash, other, count: data.length, expected: Number(active!.opening_amount) + cash };
    },
  });

  const openMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("open_cash_session", { p_opening: Number(openAmt) || 0 });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Turno aberto"); setOpenAmt("0"); qc.invalidateQueries({ queryKey: ["my-cash-sessions"] }); },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const closeMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("close_cash_session", { p_counted: Number(counted) || 0, p_notes: notes || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Turno fechado");
      setCloseOpen(false); setCounted(""); setNotes("");
      qc.invalidateQueries({ queryKey: ["my-cash-sessions"] });
    },
    onError: (e: Error) => toast.error("Falha ao fechar", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      {active ? (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" /> Turno aberto</CardTitle>
            <p className="text-sm text-muted-foreground">Aberto em {formatDateTime(active.opened_at)}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Abertura" value={formatMZN(Number(active.opening_amount))} icon={<ArrowUpCircle className="h-4 w-4" />} />
              <Stat label="Vendas em numerário" value={formatMZN(liveTotals.data?.cash ?? 0)} icon={<Banknote className="h-4 w-4" />} />
              <Stat label="Vendas digitais" value={formatMZN(liveTotals.data?.other ?? 0)} icon={<ArrowDownCircle className="h-4 w-4" />} />
              <Stat label="Esperado em caixa" value={formatMZN(liveTotals.data?.expected ?? Number(active.opening_amount))} highlight />
            </div>
            <Button onClick={() => { setCounted(String(liveTotals.data?.expected ?? 0)); setCloseOpen(true); }}>
              <Square className="mr-2 h-4 w-4" /> Fechar turno
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Play className="h-5 w-5" /> Abrir turno</CardTitle>
            <p className="text-sm text-muted-foreground">Conte o valor inicial na gaveta para começar a registar vendas.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label>Valor de abertura (MT)</Label>
                <Input type="number" min="0" step="0.01" value={openAmt} onChange={(e) => setOpenAmt(e.target.value)} />
              </div>
              <Button onClick={() => openMut.mutate()} disabled={openMut.isPending}>
                {openMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Abrir turno
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Os meus turnos</CardTitle></CardHeader>
        <CardContent>
          {sessions.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aberto</TableHead>
                  <TableHead>Fechado</TableHead>
                  <TableHead className="text-right">Abertura</TableHead>
                  <TableHead className="text-right">Esperado</TableHead>
                  <TableHead className="text-right">Contado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.data?.map((s) => {
                  const diff = s.difference ?? 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{formatDateTime(s.opened_at)}</TableCell>
                      <TableCell className="text-xs">{s.closed_at ? formatDateTime(s.closed_at) : "—"}</TableCell>
                      <TableCell className="text-right">{formatMZN(Number(s.opening_amount))}</TableCell>
                      <TableCell className="text-right">{s.expected_amount != null ? formatMZN(Number(s.expected_amount)) : "—"}</TableCell>
                      <TableCell className="text-right">{s.counted_amount != null ? formatMZN(Number(s.counted_amount)) : "—"}</TableCell>
                      <TableCell className={`text-right ${diff < 0 ? "text-destructive" : diff > 0 ? "text-emerald-600" : ""}`}>
                        {s.closed_at ? formatMZN(diff) : "—"}
                      </TableCell>
                      <TableCell>
                        {s.status === "open"
                          ? <Badge className="bg-emerald-600/15 text-emerald-700">Aberto</Badge>
                          : <Badge variant="secondary">Fechado</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fechar turno</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="flex justify-between"><span>Esperado em caixa</span><strong>{formatMZN(liveTotals.data?.expected ?? 0)}</strong></div>
              <div className="flex justify-between text-muted-foreground"><span>Vendas: {liveTotals.data?.count ?? 0}</span><span>numerário {formatMZN(liveTotals.data?.cash ?? 0)}</span></div>
            </div>
            <div>
              <Label>Valor contado na gaveta (MT)</Label>
              <Input type="number" min="0" step="0.01" value={counted} onChange={(e) => setCounted(e.target.value)} />
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            {counted && Number(counted) !== (liveTotals.data?.expected ?? 0) && (
              <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Diferença de {formatMZN(Number(counted) - (liveTotals.data?.expected ?? 0))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCloseOpen(false)}>Cancelar</Button>
            <Button onClick={() => closeMut.mutate()} disabled={closeMut.isPending}>
              {closeMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmar fecho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, icon, highlight }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${highlight ? "border-emerald-500/40 bg-emerald-500/10" : "bg-card"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
