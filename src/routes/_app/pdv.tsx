import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Trash2, ShoppingCart, Search, Loader2, Check, Package, Layers } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { ReceiptDialog } from "@/components/ReceiptDialog";

export const Route = createFileRoute("/_app/pdv")({
  component: PDVPage,
});

type UnitKind = "pack" | "sub";

type Product = {
  id: string;
  name: string;
  sale_price: number;
  barcode: string | null;
  requires_prescription: boolean;
  unit: string | null;
  pack_size: number;
  sub_unit_label: string | null;
  sub_unit_price: number | null;
};

type CartItem = {
  product: Product;
  quantity: number;
  unit_kind: UnitKind;
  unit_label: string;
  unit_price: number;
};

function cartKey(productId: string, kind: UnitKind) {
  return `${productId}::${kind}`;
}

function PDVPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string>("");
  const [payment, setPayment] = useState<"cash" | "debit" | "credit" | "pix" | "other">("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [receiptSaleId, setReceiptSaleId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Atalho global: "/" foca a busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ["pdv-products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, sale_price, barcode, requires_prescription, unit, pack_size, sub_unit_label, sub_unit_price")
        .eq("active", true)
        .order("name")
        .limit(50);
      if (search) q = q.or(`name.ilike.%${search}%,barcode.ilike.%${search}%,active_ingredient.ilike.%${search}%`);
      const { data } = await q;
      return (data ?? []) as unknown as Product[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["pdv-customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id, full_name").order("full_name").limit(200);
      return data ?? [];
    },
  });

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unit_price * i.quantity, 0), [cart]);
  const total = Math.max(0, subtotal - discount);

  const addToCart = (p: Product, kind: UnitKind) => {
    const isSub = kind === "sub";
    const unit_label = isSub ? (p.sub_unit_label ?? "unidade") : (p.unit ?? "cx");
    const unit_price = isSub ? Number(p.sub_unit_price ?? (p.sale_price / Math.max(1, p.pack_size))) : Number(p.sale_price);
    const key = cartKey(p.id, kind);
    setCart((c) => {
      const idx = c.findIndex((i) => cartKey(i.product.id, i.unit_kind) === key);
      if (idx >= 0) {
        const next = [...c];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...c, { product: p, quantity: 1, unit_kind: kind, unit_label, unit_price }];
    });
  };
  const updateQty = (key: string, delta: number) => {
    setCart((c) => c.map((i) => cartKey(i.product.id, i.unit_kind) === key
      ? { ...i, quantity: Math.max(1, i.quantity + delta) }
      : i));
  };
  const removeItem = (key: string) => setCart((c) => c.filter((i) => cartKey(i.product.id, i.unit_kind) !== key));

  const finalize = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Carrinho vazio");
      const { data, error } = await supabase.rpc("process_sale", {
        p_customer_id: customerId || (null as unknown as string),
        p_payment_method: payment,
        p_discount: discount,
        p_items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          unit_kind: i.unit_kind,
        })) as never,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (saleId) => {
      toast.success("Venda concluída!");
      setReceiptSaleId(saleId);
      setCart([]); setDiscount(0); setCustomerId(""); setPayment("cash"); setCashReceived(0);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["sales-history"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShoppingCart className="h-7 w-7" /> PDV — Nova venda</h1>
        <p className="text-muted-foreground">Adicione produtos ao carrinho e finalize. Produtos fracionáveis permitem vender por <b>caixinha</b> ou por <b>carteira</b>.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card><CardContent className="pt-6">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                ref={searchRef}
                autoFocus
                placeholder='Buscar ou ler código de barras...  (atalho: " / ")'
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && products.length > 0) {
                    e.preventDefault();
                    addToCart(products[0], "pack");
                    setSearch("");
                  }
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[460px] overflow-y-auto">
              {products.map((p) => {
                const fractionable = p.pack_size > 1 && !!p.sub_unit_label;
                const subPrice = Number(p.sub_unit_price ?? (p.sale_price / Math.max(1, p.pack_size)));
                return (
                  <div key={p.id} className="p-3 rounded-md border hover:border-primary/60 transition-colors">
                    <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.barcode ?? "—"}</p>
                    <div className="mt-2 grid grid-cols-1 gap-1.5">
                      <Button size="sm" variant="default" className="w-full justify-between h-9" onClick={() => addToCart(p, "pack")}>
                        <span className="flex items-center gap-2"><Package className="h-3.5 w-3.5" /> {fractionable ? `Caixinha (${p.pack_size} ${p.sub_unit_label}s)` : (p.unit ?? "Unidade")}</span>
                        <span className="font-bold">{formatCurrency(p.sale_price)}</span>
                      </Button>
                      {fractionable && (
                        <Button size="sm" variant="secondary" className="w-full justify-between h-9" onClick={() => addToCart(p, "sub")}>
                          <span className="flex items-center gap-2"><Layers className="h-3.5 w-3.5" /> 1 {p.sub_unit_label}</span>
                          <span className="font-bold">{formatCurrency(subPrice)}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent></Card>
        </div>

        <Card className="lg:sticky lg:top-6 h-fit">
          <CardHeader><CardTitle>Carrinho ({cart.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Vazio</p>}
              {cart.map((i) => {
                const key = cartKey(i.product.id, i.unit_kind);
                return (
                  <div key={key} className="flex items-center gap-2 p-2 rounded bg-muted/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{i.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {i.unit_kind === "pack" ? <Package className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                          {i.unit_label}
                        </span>
                        {" · "}{formatCurrency(i.unit_price)} × {i.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(key, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="text-sm w-6 text-center">{i.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(key, 1)}><Plus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(key)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="space-y-1">
                <Label className="text-xs">Cliente (opcional)</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Sem cliente" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c: { id: string; full_name: string }) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pagamento</Label>
                <Select value={payment} onValueChange={(v) => setPayment(v as typeof payment)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="debit">Débito</SelectItem>
                    <SelectItem value="credit">Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Desconto (R$)</Label>
                <Input type="number" step="0.01" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>− {formatCurrency(discount)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span className="text-primary">{formatCurrency(total)}</span></div>
            </div>

            <Button className="w-full" size="lg" disabled={cart.length === 0 || finalize.isPending} onClick={() => finalize.mutate()}>
              {finalize.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Finalizar venda
            </Button>
          </CardContent>
        </Card>
      </div>

      <ReceiptDialog
        saleId={receiptSaleId}
        open={!!receiptSaleId}
        onOpenChange={(o) => { if (!o) setReceiptSaleId(null); }}
      />
    </div>
  );
}
