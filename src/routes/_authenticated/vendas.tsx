import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatMZN, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({ meta: [{ title: "Vendas — PharmaSys" }] }),
  component: VendasPage,
});

type UnitKind = "pack" | "sub";
type CartItem = {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  unit_kind: UnitKind;
  unit_label: string;
  available: number;
  requires_prescription: boolean;
};

type PaymentMethod = "cash" | "debit" | "credit" | "pix" | "other";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Numerário",
  debit: "Cartão Débito",
  credit: "Cartão Crédito",
  pix: "M-Pesa / e-Mola",
  other: "Outro",
};

function VendasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["pdv-products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, sale_price, sub_unit_price, sub_unit_label, unit, pack_size, requires_prescription, batches(quantity, expiry_date)")
        .eq("active", true)
        .order("name")
        .limit(40);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  function availableUnits(batches: Array<{ quantity: number; expiry_date: string }> | null) {
    const today = new Date().toISOString().slice(0, 10);
    return (batches ?? []).filter((b) => b.expiry_date >= today).reduce((s, b) => s + b.quantity, 0);
  }

  function addToCart(p: any, kind: UnitKind) {
    const units = availableUnits(p.batches);
    const packSize = Math.max(1, p.pack_size ?? 1);
    const availableInDisplay = kind === "sub" ? units : Math.floor(units / packSize);
    if (availableInDisplay <= 0) {
      toast.error("Sem estoque disponível");
      return;
    }
    const unitPrice = kind === "sub" ? Number(p.sub_unit_price ?? 0) : Number(p.sale_price ?? 0);
    if (kind === "sub" && !p.sub_unit_price) {
      toast.error("Produto não vende em sub-unidade");
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product_id === p.id && i.unit_kind === kind);
      if (idx >= 0) {
        const next = [...prev];
        if (next[idx].quantity + 1 > availableInDisplay) {
          toast.error("Quantidade excede estoque");
          return prev;
        }
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          product_id: p.id,
          name: p.name,
          unit_price: unitPrice,
          quantity: 1,
          unit_kind: kind,
          unit_label: kind === "sub" ? p.sub_unit_label ?? "unidade" : p.unit ?? "cx",
          available: availableInDisplay,
          requires_prescription: p.requires_prescription,
        },
      ];
    });
  }

  function changeQty(idx: number, delta: number) {
    setCart((prev) => {
      const next = [...prev];
      const q = next[idx].quantity + delta;
      if (q <= 0) return next.filter((_, i) => i !== idx);
      if (q > next[idx].available) {
        toast.error("Quantidade excede estoque");
        return prev;
      }
      next[idx] = { ...next[idx], quantity: q };
      return next;
    });
  }

  function removeItem(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.quantity * i.unit_price, 0), [cart]);
  const total = Math.max(0, subtotal - discount);

  const finalize = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Carrinho vazio");
      const { data, error } = await supabase.rpc("process_sale", {
        p_customer_id: null as unknown as string,
        p_payment_method: payment,
        p_discount: discount,
        p_items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          unit_kind: i.unit_kind,
        })),
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (saleId) => {
      toast.success("Venda finalizada");
      setLastSaleId(saleId);
      setCart([]);
      setDiscount(0);
      setPayment("cash");
      queryClient.invalidateQueries({ queryKey: ["pdv-products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error("Falha ao finalizar", { description: e.message }),
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Ponto de Venda (PDV)</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Pesquise um produto e adicione ao carrinho.</p>
          </div>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome do medicamento…" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {products.map((p: any) => {
                const units = availableUnits(p.batches);
                const packSize = Math.max(1, p.pack_size ?? 1);
                const packs = Math.floor(units / packSize);
                return (
                  <div key={p.id} className="flex flex-col gap-2 rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.unit ?? "cx"} · pack {packSize}</p>
                      </div>
                      {p.requires_prescription && <Badge variant="secondary" className="text-[10px]">Receita</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{formatMZN(p.sale_price)}</span>
                      <span className={units === 0 ? "text-destructive" : "text-muted-foreground"}>{packs} cx · {units} un</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" disabled={packs <= 0} onClick={() => addToCart(p, "pack")}>
                        + Caixa
                      </Button>
                      {p.sub_unit_price ? (
                        <Button size="sm" variant="outline" className="flex-1" disabled={units <= 0} onClick={() => addToCart(p, "sub")}>
                          + {p.sub_unit_label ?? "Un"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Carrinho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Adicione produtos para começar.</p>
          ) : (
            <div className="space-y-2">
              {cart.map((it, idx) => (
                <div key={`${it.product_id}-${it.unit_kind}`} className="rounded-lg border p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">{formatMZN(it.unit_price)} / {it.unit_label}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(idx, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm">{it.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(idx, +1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <span className="text-sm font-semibold">{formatMZN(it.quantity * it.unit_price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMZN(subtotal)}</span></div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="discount" className="text-sm">Desconto</Label>
              <Input id="discount" type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="h-8 w-28 text-right" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm">Pagamento</Label>
              <Select value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)}>
                <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span><span>{formatMZN(total)}</span>
            </div>
          </div>

          <Button className="w-full" size="lg" disabled={cart.length === 0 || finalize.isPending} onClick={() => finalize.mutate()}>
            {finalize.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalizar venda
          </Button>
        </CardContent>
      </Card>

      <Dialog open={!!lastSaleId} onOpenChange={(o) => !o && setLastSaleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Venda registada</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Referência: <span className="font-mono">{lastSaleId?.slice(0, 8)}</span></p>
          <p className="text-sm text-muted-foreground">Concluída em {formatDateTime(new Date())}.</p>
          <DialogFooter>
            <Button onClick={() => setLastSaleId(null)}>Nova venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
