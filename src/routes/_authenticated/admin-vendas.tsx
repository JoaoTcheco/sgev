import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Undo2, ShoppingCart, ShieldAlert, Receipt as ReceiptIcon } from "lucide-react";
import { toast } from "sonner";
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
import { formatDateTime, formatMZN } from "@/lib/format";
import { useAuthUser, useUserRoles, highestRole } from "@/hooks/use-auth";
import { invalidateAfterSale } from "@/lib/invalidate";

export const Route = createFileRoute("/_authenticated/admin-vendas")({
  head: () => ({ meta: [{ title: "Vendas (Admin) — PharmaSys" }] }),
  component: AdminVendasPage,
});

type SaleRow = {
  id: string;
  receipt_number: string | null;
  sale_number: number;
  total: number;
  subtotal: number;
  discount: number;
  refunded_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  user_id: string | null;
  account_id: string | null;
};

function AdminVendasPage() {
  const { user } = useAuthUser();
  const { data: roles = [] } = useUserRoles(user?.id);
  const isAdmin = highestRole(roles) === "admin";
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["admin-sales", from, to],
    enabled: isAdmin,
    queryFn: async () => {
      let q = supabase
        .from("sales")
        .select("id, receipt_number, sale_number, total, subtotal, discount, refunded_amount, status, payment_method, created_at, user_id, account_id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (from) q = q.gte("created_at", new Date(from + "T00:00:00").toISOString());
      if (to) q = q.lte("created_at", new Date(to + "T23:59:59").toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SaleRow[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return sales;
    return sales.filter(
      (r) =>
        (r.receipt_number ?? "").toLowerCase().includes(s) ||
        String(r.sale_number).includes(s),
    );
  }, [sales, search]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Apenas Administradores podem aceder a esta página.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Todas as Vendas</CardTitle>
          <p className="text-sm text-muted-foreground">Visão global de todas as vendas do sistema. Administradores podem efetuar estornos.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="text-xs">Pesquisar</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Recibo ou nº venda…" className="pl-9" />
              </div>
            </div>
            <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recibo</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Estornado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-40"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">Sem resultados.</TableCell></TableRow>
                ) : filtered.map((s) => {
                  const refunded = Number(s.refunded_amount ?? 0);
                  const total = Number(s.total);
                  const fully = refunded >= total;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm">{s.receipt_number ?? `#${s.sale_number}`}</TableCell>
                      <TableCell className="text-xs">{formatDateTime(s.created_at)}</TableCell>
                      <TableCell className="text-xs uppercase">{s.payment_method}</TableCell>
                      <TableCell className="text-right">{formatMZN(total)}</TableCell>
                      <TableCell className="text-right text-destructive">{refunded > 0 ? formatMZN(refunded) : "—"}</TableCell>
                      <TableCell>
                        {s.status === "canceled" || fully ? (
                          <Badge variant="destructive">Anulada</Badge>
                        ) : refunded > 0 ? (
                          <Badge className="bg-amber-500/15 text-amber-700">Parcial</Badge>
                        ) : (
                          <Badge variant="secondary">Concluída</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/recibo/$ref" params={{ ref: s.receipt_number ?? s.id }}>
                            <ReceiptIcon className="mr-1 h-4 w-4" /> Recibo
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={fully || s.status === "canceled"}
                          onClick={() => setSelectedId(s.id)}
                        >
                          <Undo2 className="mr-1 h-4 w-4" /> Estornar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RefundDialog
        saleId={selectedId}
        onClose={() => setSelectedId(null)}
        onDone={() => { setSelectedId(null); invalidateAfterSale(qc); qc.invalidateQueries({ queryKey: ["admin-sales"] }); }}
      />
    </div>
  );
}

type SaleDetail = SaleRow & { items: Array<{ id: string; product_id: string; product_name: string; quantity: number; refunded_qty: number; unit_price: number; unit_kind: string; unit_label: string | null; batch_id: string | null }> };

function RefundDialog({ saleId, onClose, onDone }: { saleId: string | null; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<"value" | "items">("items");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [qtyByItem, setQtyByItem] = useState<Record<string, number>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sale-detail", saleId],
    enabled: !!saleId,
    queryFn: async () => {
      const [saleRes, itemsRes] = await Promise.all([
        supabase.from("sales").select("id, receipt_number, sale_number, total, subtotal, discount, refunded_amount, status, payment_method, created_at, user_id, account_id").eq("id", saleId!).maybeSingle(),
        supabase.from("sale_items").select("id, product_id, product_name, quantity, refunded_qty, unit_price, unit_kind, unit_label, batch_id").eq("sale_id", saleId!).order("created_at"),
      ]);
      if (saleRes.error) throw saleRes.error;
      if (itemsRes.error) throw itemsRes.error;
      const sale = saleRes.data as SaleRow;
      return { ...sale, items: (itemsRes.data ?? []) as SaleDetail["items"] };
    },
  });

  const available = data ? Number(data.total) - Number(data.refunded_amount ?? 0) : 0;

  const computedItemsValue = useMemo(() => {
    if (!data) return 0;
    return data.items.reduce((s, it) => s + (qtyByItem[it.id] ?? 0) * Number(it.unit_price), 0);
  }, [qtyByItem, data]);

  const refund = useMutation({
    mutationFn: async () => {
      if (!saleId) throw new Error("Venda inválida");
      const payload: Record<string, unknown> = {
        p_sale_id: saleId,
        p_mode: mode,
        p_reason: reason || null,
      };
      if (mode === "value") {
        const v = Number(amount);
        if (!v || v <= 0) throw new Error("Informe um valor válido");
        payload.p_amount = v;
      } else {
        const items = Object.entries(qtyByItem)
          .filter(([, q]) => q > 0)
          .map(([sale_item_id, quantity]) => ({ sale_item_id, quantity }));
        if (items.length === 0) throw new Error("Selecione ao menos um item");
        payload.p_items = items;
      }
      const { data: res, error } = await supabase.rpc("refund_sale" as never, payload as never);
      if (error) throw error;
      return res;
    },
    onSuccess: (res: unknown) => {
      const r = res as { refunded: number; fully_refunded: boolean };
      toast.success(`Estorno concluído: ${formatMZN(Number(r.refunded))}`, {
        description: r.fully_refunded ? "Venda totalmente anulada." : "Estorno parcial registado.",
      });
      onDone();
      setAmount(""); setReason(""); setQtyByItem({});
    },
    onError: (e: Error) => toast.error("Falha no estorno", { description: e.message }),
  });

  function setItemQty(id: string, max: number, val: string) {
    const n = Math.max(0, Math.min(max, Number(val) || 0));
    setQtyByItem((p) => ({ ...p, [id]: n }));
  }

  return (
    <Dialog open={!!saleId} onOpenChange={(o) => { if (!o) { onClose(); setQtyByItem({}); setAmount(""); setReason(""); } }}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Undo2 className="h-5 w-5" /> Estornar venda {data?.receipt_number ?? ""}</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/30 p-3 text-sm">
              <div><div className="text-xs text-muted-foreground">Total da venda</div><div className="font-semibold">{formatMZN(Number(data.total))}</div></div>
              <div><div className="text-xs text-muted-foreground">Já estornado</div><div className="font-semibold text-destructive">{formatMZN(Number(data.refunded_amount ?? 0))}</div></div>
              <div><div className="text-xs text-muted-foreground">Disponível</div><div className="font-semibold text-emerald-700">{formatMZN(available)}</div></div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Tipo de estorno</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "value" | "items")} className="mt-2 grid grid-cols-2 gap-2">
                <label className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 ${mode === "items" ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value="items" id="mode-items" className="mt-1" />
                  <div>
                    <div className="text-sm font-medium">Medicamento específico</div>
                    <div className="text-xs text-muted-foreground">Devolve item(s) ao estoque e reembolsa o valor correspondente.</div>
                  </div>
                </label>
                <label className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 ${mode === "value" ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value="value" id="mode-value" className="mt-1" />
                  <div>
                    <div className="text-sm font-medium">Apenas valor</div>
                    <div className="text-xs text-muted-foreground">Reembolsa um valor monetário sem alterar o estoque.</div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {mode === "items" ? (
              <div className="space-y-2">
                <Label className="text-xs">Selecione as quantidades a devolver</Label>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Vendido</TableHead>
                        <TableHead className="text-right">Já dev.</TableHead>
                        <TableHead className="text-right">Preço un.</TableHead>
                        <TableHead className="w-28">Devolver</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((it) => {
                        const max = it.quantity - (it.refunded_qty ?? 0);
                        return (
                          <TableRow key={it.id}>
                            <TableCell className="text-sm">
                              {it.product_name}
                              <div className="text-xs text-muted-foreground">{it.unit_label ?? it.unit_kind}</div>
                            </TableCell>
                            <TableCell className="text-right">{it.quantity}</TableCell>
                            <TableCell className="text-right">{it.refunded_qty ?? 0}</TableCell>
                            <TableCell className="text-right">{formatMZN(Number(it.unit_price))}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={max}
                                disabled={max <= 0}
                                value={qtyByItem[it.id] ?? ""}
                                onChange={(e) => setItemQty(it.id, max, e.target.value)}
                                className="h-8"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor a estornar</span>
                  <span className="font-semibold">{formatMZN(computedItemsValue)}</span>
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-xs">Valor a estornar (MT)</Label>
                <Input type="number" min={0} step="0.01" max={available} value={amount} onChange={(e) => setAmount(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Máximo: {formatMZN(available)}</p>
              </div>
            )}

            <div>
              <Label className="text-xs">Motivo (opcional)</Label>
              <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: devolução do cliente, medicamento errado, etc." />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => refund.mutate()} disabled={refund.isPending || !data}>
            {refund.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Undo2 className="mr-1 h-4 w-4" /> Confirmar estorno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
