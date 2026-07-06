import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShoppingCart, Undo2, Search, Eye, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { formatDateTime, formatMZN, formatDate, mzLocalToISO } from "@/lib/format";
import { useAuthUser, useUserRoles, highestRole } from "@/hooks/use-auth";
import { invalidateAfterSale } from "@/lib/invalidate";

export const Route = createFileRoute("/_authenticated/vendas-historico")({
  head: () => ({ meta: [{ title: "Histórico de Vendas — PharmaSys" }] }),
  component: VendasHistoricoPage,
});

const rpc = supabase.rpc as unknown as <T = unknown>(n: string, args?: Record<string, unknown>) => Promise<{ data: T; error: { message: string } | null }>;

type SaleRow = {
  id: string;
  receipt_number: string | null;
  sale_number: number | null;
  total: number;
  refunded_amount: number | null;
  status: string;
  payment_method: string;
  created_at: string;
  user_id: string | null;
  profiles?: { full_name: string | null; email: string | null } | null;
};

type SaleItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  refunded_qty: number | null;
  unit_price: number;
  total: number;
  unit_label: string | null;
  unit_kind: string | null;
};

function VendasHistoricoPage() {
  const qc = useQueryClient();
  const { user } = useAuthUser();
  const { data: roles = [] } = useUserRoles(user?.id);
  const isAdmin = highestRole(roles) === "admin";

  const [search, setSearch] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [refundSale, setRefundSale] = useState<SaleRow | null>(null);
  const [viewSale, setViewSale] = useState<SaleRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["all-sales", fFrom, fTo],
    queryFn: async () => {
      let q = supabase
        .from("sales")
        .select("id, receipt_number, sale_number, total, refunded_amount, status, payment_method, created_at, user_id, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (fFrom) q = q.gte("created_at", mzLocalToISO(fFrom, 0, 0, 0));
      if (fTo) q = q.lte("created_at", mzLocalToISO(fTo, 23, 59, 59));
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SaleRow[];
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((s) =>
      (s.receipt_number ?? "").toLowerCase().includes(term) ||
      String(s.sale_number ?? "").includes(term) ||
      (s.profiles?.full_name ?? "").toLowerCase().includes(term)
    );
  }, [data, search]);

  const totals = useMemo(() => {
    const rows = filtered;
    const sum = rows.reduce((s, r) => s + Number(r.total), 0);
    const refunded = rows.reduce((s, r) => s + Number(r.refunded_amount ?? 0), 0);
    return { count: rows.length, sum, refunded, net: sum - refunded };
  }, [filtered]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Todas as vendas</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Como administrador, pode consultar todas as vendas e realizar estornos totais, parciais ou por medicamento." : "Consulta de vendas. Estornos são exclusivos do Administrador."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="text-xs">Pesquisar (recibo, nº ou operador)</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="REC-2026-000123…" className="pl-9" />
              </div>
            </div>
            <div><Label className="text-xs">De</Label><Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} /></div>
            <div><Label className="text-xs">Até</Label><Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat label="Vendas" value={String(totals.count)} />
            <Stat label="Bruto" value={formatMZN(totals.sum)} />
            <Stat label="Estornado" value={formatMZN(totals.refunded)} />
            <Stat label="Líquido" value={formatMZN(totals.net)} />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Recibo</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Estornado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-40 text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Sem vendas.</TableCell></TableRow>
                ) : filtered.map((s) => {
                  const refunded = Number(s.refunded_amount ?? 0);
                  const fully = refunded >= Number(s.total);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm font-medium">
                        <Link to="/recibo/$ref" params={{ ref: s.receipt_number ?? s.id }} className="text-primary hover:underline">
                          {s.receipt_number ?? `#${s.sale_number}`}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">{formatDateTime(s.created_at)}</TableCell>
                      <TableCell className="text-xs">{s.profiles?.full_name ?? s.profiles?.email ?? "—"}</TableCell>
                      <TableCell className="text-xs capitalize">{s.payment_method}</TableCell>
                      <TableCell className="text-right">{formatMZN(Number(s.total))}</TableCell>
                      <TableCell className="text-right text-xs">{refunded > 0 ? formatMZN(refunded) : "—"}</TableCell>
                      <TableCell>
                        {s.status === "canceled" || fully ? <Badge variant="destructive">Anulada</Badge> :
                         refunded > 0 ? <Badge variant="secondary">Parcial</Badge> :
                         <Badge>Concluída</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setViewSale(s)}><Eye className="h-4 w-4" /></Button>
                          {isAdmin && !fully && s.status !== "canceled" && (
                            <Button size="sm" variant="outline" onClick={() => setRefundSale(s)}>
                              <Undo2 className="mr-1 h-4 w-4" /> Estornar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SaleDetailDialog sale={viewSale} onClose={() => setViewSale(null)} />
      <RefundDialog
        sale={refundSale}
        isAdmin={isAdmin}
        onClose={() => setRefundSale(null)}
        onDone={() => {
          setRefundSale(null);
          qc.invalidateQueries({ queryKey: ["all-sales"] });
          invalidateAfterSale(qc);
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function useSaleItems(saleId: string | undefined) {
  return useQuery({
    queryKey: ["sale-items", saleId],
    enabled: !!saleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_items")
        .select("id, product_id, product_name, quantity, refunded_qty, unit_price, total, unit_label, unit_kind")
        .eq("sale_id", saleId!)
        .order("product_name");
      if (error) throw error;
      return (data ?? []) as unknown as SaleItem[];
    },
  });
}

function SaleDetailDialog({ sale, onClose }: { sale: SaleRow | null; onClose: () => void }) {
  const { data: items = [], isLoading } = useSaleItems(sale?.id);
  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Detalhes — {sale?.receipt_number ?? sale?.id?.slice(0, 8)}</DialogTitle></DialogHeader>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <Field label="Data" value={sale ? formatDateTime(sale.created_at) : "—"} />
              <Field label="Operador" value={sale?.profiles?.full_name ?? "—"} />
              <Field label="Pagamento" value={sale?.payment_method ?? "—"} />
              <Field label="Total" value={sale ? formatMZN(Number(sale.total)) : "—"} />
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Estornado</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="text-sm">{i.product_name} <span className="text-xs text-muted-foreground">({i.unit_label ?? "un"})</span></TableCell>
                    <TableCell className="text-right">{i.quantity}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{i.refunded_qty ?? 0}</TableCell>
                    <TableCell className="text-right">{formatMZN(Number(i.unit_price))}</TableCell>
                    <TableCell className="text-right">{formatMZN(Number(i.total))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type RefundMode = "value" | "items" | "full";

function RefundDialog({ sale, isAdmin, onClose, onDone }: { sale: SaleRow | null; isAdmin: boolean; onClose: () => void; onDone: () => void }) {
  const { data: items = [], isLoading } = useSaleItems(sale?.id);
  const [mode, setMode] = useState<RefundMode>("full");
  const [amount, setAmount] = useState<number>(0);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");

  const available = sale ? Number(sale.total) - Number(sale.refunded_amount ?? 0) : 0;

  const itemsRefundValue = useMemo(() => {
    return items.reduce((s, i) => s + (qtyMap[i.id] ?? 0) * Number(i.unit_price), 0);
  }, [items, qtyMap]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!sale) return;
      const payload: Record<string, unknown> = { p_sale_id: sale.id, p_reason: reason || null };
      if (mode === "full") { payload.p_mode = "value"; payload.p_amount = available; }
      else if (mode === "value") {
        if (amount <= 0) throw new Error("Valor inválido");
        if (amount > available) throw new Error(`Máximo disponível: ${formatMZN(available)}`);
        payload.p_mode = "value"; payload.p_amount = amount;
      } else {
        const list = Object.entries(qtyMap).filter(([, q]) => q > 0).map(([sale_item_id, quantity]) => ({ sale_item_id, quantity }));
        if (list.length === 0) throw new Error("Selecione ao menos um item");
        payload.p_mode = "items"; payload.p_items = list;
      }
      const { data, error } = await rpc("refund_sale", payload);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Estorno realizado");
      setMode("full"); setAmount(0); setQtyMap({}); setReason("");
      onDone();
    },
    onError: (e: Error) => toast.error("Falha no estorno", { description: e.message }),
  });

  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Undo2 className="h-5 w-5" /> Estornar {sale?.receipt_number ?? ""}</DialogTitle>
        </DialogHeader>

        {!isAdmin ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <ShieldAlert className="h-4 w-4" /> Apenas o Administrador pode fazer estornos.
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="rounded-md border bg-muted/30 p-3 text-xs">
              <div className="flex justify-between"><span>Total da venda</span><span className="font-semibold">{formatMZN(Number(sale?.total ?? 0))}</span></div>
              <div className="flex justify-between"><span>Já estornado</span><span>{formatMZN(Number(sale?.refunded_amount ?? 0))}</span></div>
              <div className="flex justify-between font-semibold"><span>Disponível para estorno</span><span>{formatMZN(available)}</span></div>
            </div>

            <div>
              <Label className="text-xs">Modo de estorno</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as RefundMode)} className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
                  <RadioGroupItem value="full" id="m-full" /> <span>Estorno total</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
                  <RadioGroupItem value="value" id="m-value" /> <span>Somente valor</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
                  <RadioGroupItem value="items" id="m-items" /> <span>Medicamento específico</span>
                </label>
              </RadioGroup>
            </div>

            {mode === "value" && (
              <div>
                <Label htmlFor="amt" className="text-xs">Valor a estornar</Label>
                <Input id="amt" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
                <p className="mt-1 text-xs text-muted-foreground">Máximo {formatMZN(available)}</p>
              </div>
            )}

            {mode === "items" && (
              <div className="max-h-72 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead className="text-right">Vendido</TableHead>
                    <TableHead className="text-right">Já est.</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="w-24 text-right">Qtd a estornar</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {items.map((i) => {
                      const maxQ = i.quantity - Number(i.refunded_qty ?? 0);
                      return (
                        <TableRow key={i.id}>
                          <TableCell className="text-sm">{i.product_name} <span className="text-xs text-muted-foreground">({i.unit_label ?? "un"})</span></TableCell>
                          <TableCell className="text-right">{i.quantity}</TableCell>
                          <TableCell className="text-right text-xs">{i.refunded_qty ?? 0}</TableCell>
                          <TableCell className="text-right">{formatMZN(Number(i.unit_price))}</TableCell>
                          <TableCell className="text-right">
                            <Input type="number" min={0} max={maxQ} value={qtyMap[i.id] ?? 0}
                              onChange={(e) => {
                                const v = Math.max(0, Math.min(maxQ, Number(e.target.value) || 0));
                                setQtyMap((m) => ({ ...m, [i.id]: v }));
                              }}
                              disabled={maxQ <= 0}
                              className="h-8 w-20 text-right"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex justify-between border-t bg-muted/30 p-2 text-sm font-semibold">
                  <span>Total do estorno por itens</span><span>{formatMZN(itemsRefundValue)}</span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reason" className="text-xs">Motivo (opcional)</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Ex.: produto devolvido pelo cliente" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="destructive"
            disabled={!isAdmin || mutation.isPending || (mode === "items" && itemsRefundValue <= 0) || (mode === "value" && amount <= 0)}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo2 className="mr-2 h-4 w-4" />}
            Confirmar estorno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-[10px] uppercase text-muted-foreground">{label}</div><div>{value ?? "—"}</div></div>;
}
