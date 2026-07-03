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
import { usePharmacySettings } from "@/hooks/use-settings";
import { useAuthUser, useProfile } from "@/hooks/use-auth";
import { ReceiptBody } from "@/routes/_authenticated/configuracoes";
import { printReceiptWindow } from "@/lib/print-receipt";
import { useOpenCashSession } from "@/hooks/use-cash-session";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { Link } from "@tanstack/react-router";

import { AlertTriangle } from "lucide-react";


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
  const { data: settings } = usePharmacySettings();
  const { user } = useAuthUser();
  const { data: profile } = useProfile(user?.id);
  const { data: openSession } = useOpenCashSession();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [step, setStep] = useState<Step>("cart");
  const [paymentKind, setPaymentKind] = useState<PaymentKind>("cash");
  const [wallet, setWallet] = useState<DigitalWallet>("mpesa");
  const [received, setReceived] = useState<number>(0);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<{ id: string; receipt_number: string | null; at: Date } | null>(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ["pdv-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .select("id, name, is_system, active")
        .eq("active", true)
        .order("is_system", { ascending: false })
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Default to Caixa once accounts arrive
  if (!accountId && accounts.length > 0) {
    const caixa = accounts.find((a: any) => a.is_system) ?? accounts[0];
    if (caixa) setTimeout(() => setAccountId(caixa.id), 0);
  }

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["pdv-products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, sale_price, sub_unit_price, sub_unit_label, unit, pack_size, requires_prescription, batches(quantity, expiry_date)")
        .eq("active", true)
        .order("name")
        .limit(40);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(`name.ilike.${term},barcode.ilike.${term}`);
      }

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

  // Hardware barcode scanner → match by barcode (caixa) or sub_barcode (caixinha avulsa).
  useBarcodeScanner(async (code) => {
    if (!openSession || step !== "cart") return;
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sale_price, sub_unit_price, sub_unit_label, unit, pack_size, requires_prescription, barcode, sub_barcode, batches(quantity, expiry_date)")
      .or(`barcode.eq.${code},sub_barcode.eq.${code}`)
      .eq("active", true)
      .maybeSingle();
    if (error) { toast.error("Falha", { description: error.message }); return; }
    if (!data) { toast.error(`Código ${code} não encontrado`); return; }
    const kind: UnitKind = data.sub_barcode === code ? "sub" : "pack";
    addToCart(data, kind);
  });


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
      if (!accountId) throw new Error("Selecione a conta de destino");
      const { data, error } = await supabase.rpc("process_sale", {
        p_customer_id: null as unknown as string,
        p_payment_method: paymentEnum,
        p_discount: discount,
        p_items: cart.map((i) => ({
          product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, unit_kind: i.unit_kind,
        })),
        p_account_id: accountId,
      });
      if (error) throw error;
      // process_sale may return either a legacy sale id (string) or the new
      // { sale_id, txn_id, receipt } payload with per-transaction traceability.
      const payload = data as string | { sale_id: string; txn_id?: string; receipt?: string };
      const saleId = typeof payload === "string" ? payload : payload.sale_id;
      let receipt_number = typeof payload === "object" ? payload.receipt ?? null : null;
      if (!receipt_number) {
        const { data: sale } = await supabase.from("sales").select("receipt_number").eq("id", saleId).maybeSingle();
        receipt_number = (sale?.receipt_number as string | null) ?? null;
      }
      return { saleId, receipt_number };
    },
    onSuccess: ({ saleId, receipt_number }) => {
      toast.success("Venda finalizada", { description: receipt_number ? `Recibo ${receipt_number}` : undefined });
      setLastSale({ id: saleId, receipt_number, at: new Date() });
      queryClient.invalidateQueries({ queryKey: ["pdv-products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e: Error) => toast.error("Falha ao finalizar", { description: e.message }),
  });

  function printReceipt() {
    if (!settings || !lastSale) return;
    try {
      printReceiptWindow({
        settings,
        items: cart.map((i) => ({ name: i.name, quantity: i.quantity, unit_label: i.unit_label, unit_price: i.unit_price })),
        subtotal,
        discount,
        total,
        paymentLabel,
        received: paymentKind === "cash" ? received : null,
        change: paymentKind === "cash" ? change : null,
        ref: lastSale.receipt_number ?? lastSale.id,
        operatorName: profile?.full_name ?? user?.email ?? null,
        at: new Date(lastSale.at),
      });
    } catch (e) {
      toast.error("Falha ao imprimir", { description: (e as Error).message });
    }
  }

  return (
    <div className="space-y-4">
      {!openSession && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span><strong>Sem turno aberto.</strong> Abra um turno de caixa para registar vendas.</span>
            </div>
            <Button asChild size="sm"><Link to="/caixa">Ir para Caixa</Link></Button>
          </CardContent>
        </Card>
      )}
      <div className={`grid grid-cols-1 gap-4 lg:grid-cols-[1fr_440px] ${!openSession ? "pointer-events-none opacity-60" : ""}`}>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Ponto de Venda (PDV)</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Pesquise um produto e adicione ao carrinho.</p>
          </div>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome ou código de barras…" className="pl-9" />
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

              <div className="space-y-2 border-t pt-3">
                <Label className="text-sm font-semibold">Conta de destino do dinheiro</Label>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((a: any) => (
                    <button key={a.id} type="button" onClick={() => setAccountId(a.id)}
                      className={`rounded-md border p-2 text-left text-sm ${accountId === a.id ? "border-primary bg-primary/5 font-semibold" : ""}`}>
                      <div className="flex items-center gap-1">
                        {a.name}
                        {a.is_system && <Badge variant="secondary" className="text-[9px]">SISTEMA</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
                {accounts.length === 0 && (
                  <p className="text-xs text-destructive">Sem contas activas. Crie uma em Contas.</p>
                )}
              </div>

              <Button className="w-full" size="lg" disabled={(paymentKind === "cash" && received < total) || !accountId} onClick={() => setStep("receipt")}>
                Avançar
              </Button>
            </div>
          )}

          {step === "receipt" && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><Receipt className="h-4 w-4" /> Pré-visualização do recibo</div>
              <div className="flex justify-center overflow-auto rounded-md bg-background p-2">
                {settings && (
                  <ReceiptBody
                    s={settings}
                    items={cart.map((i) => ({ name: i.name, quantity: i.quantity, unit_label: i.unit_label, unit_price: i.unit_price }))}
                    subtotal={subtotal}
                    discount={discount}
                    total={total}
                    paymentLabel={paymentLabel}
                    received={paymentKind === "cash" ? received : null}
                    change={paymentKind === "cash" ? change : null}
                    saleId="PRE-VIEW"
                    operatorName={profile?.full_name ?? user?.email ?? null}
                    at={new Date()}
                  />
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
        <DialogContent className="max-w-[min(96vw,640px)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Recibo da venda</DialogTitle>
          </DialogHeader>
          <div id="print-area" className="flex justify-center overflow-auto rounded-md border bg-muted/30 p-3">
            {settings && lastSale && (
              <ReceiptBody
                s={settings}
                items={cart.map((i) => ({ name: i.name, quantity: i.quantity, unit_label: i.unit_label, unit_price: i.unit_price }))}
                subtotal={subtotal}
                discount={discount}
                total={total}
                paymentLabel={paymentLabel}
                received={paymentKind === "cash" ? received : null}
                change={paymentKind === "cash" ? change : null}
                saleId={lastSale.id}
                receiptNumber={lastSale.receipt_number}
                operatorName={profile?.full_name ?? user?.email ?? null}
                at={lastSale.at}
              />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={printReceipt}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
            <Button onClick={() => { setLastSale(null); resetAll(); }}>Nova venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );

}
