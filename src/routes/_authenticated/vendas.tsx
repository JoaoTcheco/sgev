import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Receipt, ArrowLeft, Printer, Banknote, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

type PaymentKind = "cash" | "digital";
type DigitalWallet = "bank" | "mpesa" | "emola";
type Step = "cart" | "payment" | "receipt";

const WALLET_LABELS: Record<DigitalWallet, string> = {
  bank: "Cartão Bancário",
  mpesa: "M-Pesa",
  emola: "e-Mola",
};

const WALLET_TO_ENUM: Record<DigitalWallet, "debit" | "pix" | "other"> = {
  bank: "debit",
  mpesa: "pix",
  emola: "other",
};

function VendasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [step, setStep] = useState<Step>("cart");
  const [paymentKind, setPaymentKind] = useState<PaymentKind>("cash");
  const [wallet, setWallet] = useState<DigitalWallet>("mpesa");
  const [received, setReceived] = useState<number>(0);
  const [lastSale, setLastSale] = useState<{ id: string; at: Date } | null>(null);

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
    if (availableInDisplay <= 0) { toast.error("Sem estoque disponível"); return; }
    if (kind === "sub" && !p.sub_unit_price) { toast.error("Produto não vende em sub-unidade"); return; }
    const unitPrice = kind === "sub" ? Number(p.sub_unit_price ?? 0) : Number(p.sale_price ?? 0);
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product_id === p.id && i.unit_kind === kind);
      if (idx >= 0) {
        const next = [...prev];
        if (next[idx].quantity + 1 > availableInDisplay) { toast.error("Quantidade excede estoque"); return prev; }
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, {
        product_id: p.id, name: p.name, unit_price: unitPrice, quantity: 1, unit_kind: kind,
        unit_label: kind === "sub" ? p.sub_unit_label ?? "unidade" : p.unit ?? "cx",
        available: availableInDisplay, requires_prescription: p.requires_prescription,
      }];
    });
  }

  function changeQty(idx: number, delta: number) {
    setCart((prev) => {
      const next = [...prev];
      const q = next[idx].quantity + delta;
      if (q <= 0) return next.filter((_, i) => i !== idx);
      if (q > next[idx].available) { toast.error("Quantidade excede estoque"); return prev; }
      next[idx] = { ...next[idx], quantity: q };
      return next;
    });
  }

  function removeItem(idx: number) { setCart((prev) => prev.filter((_, i) => i !== idx)); }

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.quantity * i.unit_price, 0), [cart]);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, received - total);
  const paymentEnum = paymentKind === "cash" ? "cash" : WALLET_TO_ENUM[wallet];
  const paymentLabel = paymentKind === "cash" ? "Numerário" : WALLET_LABELS[wallet];

  function resetAll() {
    setCart([]); setDiscount(0); setStep("cart");
    setPaymentKind("cash"); setWallet("mpesa"); setReceived(0);
  }

  const finalize = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Carrinho vazio");
      if (paymentKind === "cash" && received < total) throw new Error("Valor recebido insuficiente");
      const { data, error } = await supabase.rpc("process_sale", {
        p_customer_id: null as unknown as string,
        p_payment_method: paymentEnum,
        p_discount: discount,
        p_items: cart.map((i) => ({
          product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, unit_kind: i.unit_kind,
        })),
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (saleId) => {
      toast.success("Venda finalizada");
      setLastSale({ id: saleId, at: new Date() });
      queryClient.invalidateQueries({ queryKey: ["pdv-products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error("Falha ao finalizar", { description: e.message }),
  });

  function printReceipt() { window.print(); }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_440px]">
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
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{formatMZN(p.sale_price)} / {p.unit ?? "cx"}</span>
                        {p.sub_unit_price ? (
                          <span className="text-muted-foreground">{formatMZN(p.sub_unit_price)} / {p.sub_unit_label ?? "un"}</span>
                        ) : null}
                      </div>
                      <span className={units === 0 ? "text-destructive" : "text-muted-foreground"}>{packs} cx · {units} un</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" disabled={packs <= 0 || step !== "cart"} onClick={() => addToCart(p, "pack")}>
                        + Caixa
                      </Button>
                      {p.sub_unit_price ? (
                        <Button size="sm" variant="outline" className="flex-1" disabled={units <= 0 || step !== "cart"} onClick={() => addToCart(p, "sub")}>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Carrinho</CardTitle>
          {step !== "cart" && (
            <Button size="sm" variant="ghost" onClick={() => setStep(step === "receipt" ? "payment" : "cart")}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
          )}
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
                    {step === "cart" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" disabled={step !== "cart"} onClick={() => changeQty(idx, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm">{it.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" disabled={step !== "cart"} onClick={() => changeQty(idx, +1)}><Plus className="h-3 w-3" /></Button>
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
            {step === "cart" && (
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="discount" className="text-sm">Desconto</Label>
                <Input id="discount" type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="h-8 w-28 text-right" />
              </div>
            )}
            {discount > 0 && step !== "cart" && (
              <div className="flex justify-between text-muted-foreground"><span>Desconto</span><span>− {formatMZN(discount)}</span></div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span><span>{formatMZN(total)}</span>
            </div>
          </div>

          {step === "cart" && (
            <Button className="w-full" size="lg" disabled={cart.length === 0} onClick={() => setStep("payment")}>
              Fechar
            </Button>
          )}

          {step === "payment" && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <Label className="text-sm font-semibold">Forma de pagamento</Label>
              <RadioGroup value={paymentKind} onValueChange={(v) => setPaymentKind(v as PaymentKind)} className="grid grid-cols-2 gap-2">
                <label className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${paymentKind === "cash" ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value="cash" /> <Banknote className="h-4 w-4" /> Espécie
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${paymentKind === "digital" ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value="digital" /> <CreditCard className="h-4 w-4" /> Eletrónico
                </label>
              </RadioGroup>

              {paymentKind === "cash" ? (
                <div className="space-y-2">
                  <Label htmlFor="received" className="text-sm">Valor entregue</Label>
                  <Input id="received" type="number" min={0} step="0.01" value={received || ""} onChange={(e) => setReceived(Math.max(0, Number(e.target.value) || 0))} placeholder="0,00" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Troco</span>
                    <span className={`font-semibold ${received < total ? "text-destructive" : "text-emerald-600"}`}>{formatMZN(change)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm">Carteira</Label>
                  <RadioGroup value={wallet} onValueChange={(v) => setWallet(v as DigitalWallet)} className="space-y-1">
                    {(Object.keys(WALLET_LABELS) as DigitalWallet[]).map((w) => (
                      <label key={w} className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${wallet === w ? "border-primary bg-primary/5" : ""}`}>
                        <RadioGroupItem value={w} />
                        {w === "bank" ? <CreditCard className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                        {WALLET_LABELS[w]}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <Button className="w-full" size="lg" disabled={paymentKind === "cash" && received < total} onClick={() => setStep("receipt")}>
                Avançar
              </Button>
            </div>
          )}

          {step === "receipt" && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><Receipt className="h-4 w-4" /> Pré-visualização do recibo</div>
              <div className="space-y-1 rounded-md bg-background p-3 text-xs">
                <p className="text-center font-semibold">PharmaSys</p>
                <p className="text-center text-muted-foreground">{formatDateTime(new Date())}</p>
                <Separator className="my-2" />
                {cart.map((it) => (
                  <div key={`${it.product_id}-${it.unit_kind}`} className="flex justify-between">
                    <span className="truncate">{it.quantity}× {it.name} ({it.unit_label})</span>
                    <span>{formatMZN(it.quantity * it.unit_price)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between"><span>Subtotal</span><span>{formatMZN(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between"><span>Desconto</span><span>− {formatMZN(discount)}</span></div>}
                <div className="flex justify-between font-semibold"><span>Total</span><span>{formatMZN(total)}</span></div>
                <div className="flex justify-between"><span>Pagamento</span><span>{paymentLabel}</span></div>
                {paymentKind === "cash" && (
                  <>
                    <div className="flex justify-between"><span>Entregue</span><span>{formatMZN(received)}</span></div>
                    <div className="flex justify-between font-semibold"><span>Troco</span><span>{formatMZN(change)}</span></div>
                  </>
                )}
              </div>
              <Button className="w-full" size="lg" disabled={finalize.isPending} onClick={() => finalize.mutate()}>
                {finalize.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalizar venda
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!lastSale} onOpenChange={(o) => { if (!o) { setLastSale(null); resetAll(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Recibo</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 rounded-md border p-4 text-sm">
            <p className="text-center text-base font-semibold">PharmaSys</p>
            <p className="text-center text-xs text-muted-foreground">Ref: <span className="font-mono">{lastSale?.id.slice(0, 8)}</span></p>
            <p className="text-center text-xs text-muted-foreground">{lastSale && formatDateTime(lastSale.at)}</p>
            <Separator className="my-2" />
            <div className="flex justify-between"><span>Total</span><span className="font-semibold">{formatMZN(total)}</span></div>
            <div className="flex justify-between"><span>Pagamento</span><span>{paymentLabel}</span></div>
            {paymentKind === "cash" && (
              <div className="flex justify-between"><span>Troco</span><span>{formatMZN(change)}</span></div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={printReceipt}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
            <Button onClick={() => { setLastSale(null); resetAll(); }}>Nova venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
