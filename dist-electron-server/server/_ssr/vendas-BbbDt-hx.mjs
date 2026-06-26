import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { e as usePharmacySettings, f as formatMZN, R as ReceiptBody, u as useDesktopAuth, i as isDesktop, p as processSale, h as findProductByBarcode, c as getOpenCashSession, l as listPosProducts } from "./router-DE-fAUtY.mjs";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { S as Separator } from "./separator-DGgIueqr.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-8XiXuMbO.mjs";
import { R as Root2, I as Item2, a as Indicator } from "../_libs/radix-ui__react-radio-group.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { u as useAuthUser, b as useProfile } from "./use-auth-ButDQezc.mjs";
import { u as useBarcodeScanner } from "./use-barcode-scanner-C7zwwjGv.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import "../_libs/jsbarcode.mjs";
import { T as TriangleAlert, h as Search, L as LoaderCircle, S as ShoppingCart, A as ArrowLeft, i as Trash2, j as Minus, k as Plus, B as Banknote, l as CreditCard, m as Smartphone, R as Receipt, n as Printer, o as Circle } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "./client-D9M-ftIG.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-separator.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/tailwind-merge.mjs";
const RadioGroup = reactExports.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root2, { className: cn("grid gap-2", className), ...props, ref });
});
RadioGroup.displayName = Root2.displayName;
const RadioGroupItem = reactExports.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Item2,
    {
      ref,
      className: cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Indicator, { className: "flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-3.5 w-3.5 fill-primary" }) })
    }
  );
});
RadioGroupItem.displayName = Item2.displayName;
function useOpenCashSession() {
  const { user } = useAuthUser();
  const { user: dUser } = useDesktopAuth();
  const userId = isDesktop() ? dUser?.id : user?.id;
  return useQuery({
    queryKey: ["open-cash-session", userId],
    enabled: !!userId,
    refetchInterval: 3e4,
    queryFn: async () => {
      const row = await getOpenCashSession(userId);
      return row ?? null;
    }
  });
}
const WALLET_LABELS = {
  bank: "Cartão Bancário",
  mpesa: "M-Pesa",
  emola: "e-Mola"
};
function VendasPage() {
  const queryClient = useQueryClient();
  const {
    data: settings
  } = usePharmacySettings();
  const {
    user
  } = useAuthUser();
  const {
    data: profile
  } = useProfile(user?.id);
  const {
    data: openSession
  } = useOpenCashSession();
  const [search, setSearch] = reactExports.useState("");
  const [cart, setCart] = reactExports.useState([]);
  const [discount, setDiscount] = reactExports.useState(0);
  const [step, setStep] = reactExports.useState("cart");
  const [paymentKind, setPaymentKind] = reactExports.useState("cash");
  const [wallet, setWallet] = reactExports.useState("mpesa");
  const [received, setReceived] = reactExports.useState(0);
  const [lastSale, setLastSale] = reactExports.useState(null);
  const {
    data: products = [],
    isLoading
  } = useQuery({
    queryKey: ["pdv-products", search],
    queryFn: () => listPosProducts(search)
  });
  function availableUnits(batches) {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    return (batches ?? []).filter((b) => b.expiry_date >= today).reduce((s, b) => s + b.quantity, 0);
  }
  function addToCart(p, kind) {
    const units = availableUnits(p.batches);
    const packSize = Math.max(1, p.pack_size ?? 1);
    const availableInDisplay = kind === "sub" ? units : Math.floor(units / packSize);
    if (availableInDisplay <= 0) {
      toast.error("Sem estoque disponível");
      return;
    }
    if (kind === "sub" && !p.sub_unit_price) {
      toast.error("Produto não vende em sub-unidade");
      return;
    }
    const unitPrice = kind === "sub" ? Number(p.sub_unit_price ?? 0) : Number(p.sale_price ?? 0);
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product_id === p.id && i.unit_kind === kind);
      if (idx >= 0) {
        const next = [...prev];
        if (next[idx].quantity + 1 > availableInDisplay) {
          toast.error("Quantidade excede estoque");
          return prev;
        }
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + 1
        };
        return next;
      }
      return [...prev, {
        product_id: p.id,
        name: p.name,
        unit_price: unitPrice,
        quantity: 1,
        unit_kind: kind,
        unit_label: kind === "sub" ? p.sub_unit_label ?? "unidade" : p.unit ?? "cx",
        available: availableInDisplay,
        requires_prescription: p.requires_prescription
      }];
    });
  }
  function changeQty(idx, delta) {
    setCart((prev) => {
      const next = [...prev];
      const q = next[idx].quantity + delta;
      if (q <= 0) return next.filter((_, i) => i !== idx);
      if (q > next[idx].available) {
        toast.error("Quantidade excede estoque");
        return prev;
      }
      next[idx] = {
        ...next[idx],
        quantity: q
      };
      return next;
    });
  }
  function removeItem(idx) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }
  useBarcodeScanner(async (code) => {
    if (!openSession || step !== "cart") return;
    try {
      const data = await findProductByBarcode(code);
      if (!data) {
        toast.error(`Código ${code} não encontrado`);
        return;
      }
      addToCart(data, "pack");
    } catch (e) {
      toast.error("Falha", {
        description: e.message
      });
    }
  });
  const subtotal = reactExports.useMemo(() => cart.reduce((s, i) => s + i.quantity * i.unit_price, 0), [cart]);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, received - total);
  const paymentLabel = paymentKind === "cash" ? "Numerário" : WALLET_LABELS[wallet];
  function resetAll() {
    setCart([]);
    setDiscount(0);
    setStep("cart");
    setPaymentKind("cash");
    setWallet("mpesa");
    setReceived(0);
  }
  const finalize = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Carrinho vazio");
      if (paymentKind === "cash" && received < total) throw new Error("Valor recebido insuficiente");
      return processSale({
        paymentKind,
        wallet,
        discount,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          unit_kind: i.unit_kind
        })),
        amountReceived: paymentKind === "cash" ? received : null,
        changeDue: paymentKind === "cash" ? change : null
      });
    },
    onSuccess: ({
      saleId,
      receipt_number
    }) => {
      toast.success("Venda finalizada", {
        description: receipt_number ? `Recibo ${receipt_number}` : void 0
      });
      setLastSale({
        id: saleId,
        receipt_number,
        at: /* @__PURE__ */ new Date()
      });
      queryClient.invalidateQueries({
        queryKey: ["pdv-products"]
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard"]
      });
    },
    onError: (e) => toast.error("Falha ao finalizar", {
      description: e.message
    })
  });
  function printReceipt() {
    window.print();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    !openSession && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-amber-500/50 bg-amber-500/10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-amber-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Sem turno aberto." }),
          " Abra um turno de caixa para registar vendas."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/caixa", children: "Ir para Caixa" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `grid grid-cols-1 gap-4 lg:grid-cols-[1fr_440px] ${!openSession ? "pointer-events-none opacity-60" : ""}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Ponto de Venda (PDV)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Pesquise um produto e adicione ao carrinho." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-72", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Nome ou código de barras…", className: "pl-9" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : products.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-10 text-center text-sm text-muted-foreground", children: "Nenhum produto encontrado." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3", children: products.map((p) => {
          const units = availableUnits(p.batches);
          const packSize = Math.max(1, p.pack_size ?? 1);
          const packs = Math.floor(units / packSize);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 rounded-lg border p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: p.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  p.unit ?? "cx",
                  " · pack ",
                  packSize
                ] })
              ] }),
              p.requires_prescription && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[10px]", children: "Receita" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-foreground", children: [
                  formatMZN(p.sale_price),
                  " / ",
                  p.unit ?? "cx"
                ] }),
                p.sub_unit_price ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                  formatMZN(p.sub_unit_price),
                  " / ",
                  p.sub_unit_label ?? "un"
                ] }) : null
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: units === 0 ? "text-destructive" : "text-muted-foreground", children: [
                packs,
                " cx · ",
                units,
                " un"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "flex-1", disabled: packs <= 0 || step !== "cart", onClick: () => addToCart(p, "pack"), children: "+ Caixa" }),
              p.sub_unit_price ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "flex-1", disabled: units <= 0 || step !== "cart", onClick: () => addToCart(p, "sub"), children: [
                "+ ",
                p.sub_unit_label ?? "Un"
              ] }) : null
            ] })
          ] }, p.id);
        }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "self-start", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-5 w-5" }),
            " Carrinho"
          ] }),
          step !== "cart" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", onClick: () => setStep(step === "receipt" ? "payment" : "cart"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-1 h-4 w-4" }),
            " Voltar"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          cart.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-6 text-center text-sm text-muted-foreground", children: "Adicione produtos para começar." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: cart.map((it, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: it.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  formatMZN(it.unit_price),
                  " / ",
                  it.unit_label
                ] })
              ] }),
              step === "cart" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7", onClick: () => removeItem(idx), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "outline", className: "h-7 w-7", disabled: step !== "cart", onClick: () => changeQty(idx, -1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-3 w-3" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-8 text-center text-sm", children: it.quantity }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "outline", className: "h-7 w-7", disabled: step !== "cart", onClick: () => changeQty(idx, 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3" }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold", children: formatMZN(it.quantity * it.unit_price) })
            ] })
          ] }, `${it.product_id}-${it.unit_kind}`)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Subtotal" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatMZN(subtotal) })
            ] }),
            step === "cart" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "discount", className: "text-sm", children: "Desconto" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "discount", type: "number", min: 0, step: "0.01", value: discount, onChange: (e) => setDiscount(Math.max(0, Number(e.target.value) || 0)), className: "h-8 w-28 text-right" })
            ] }),
            discount > 0 && step !== "cart" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Desconto" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "− ",
                formatMZN(discount)
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-base font-semibold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatMZN(total) })
            ] })
          ] }),
          step === "cart" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", size: "lg", disabled: cart.length === 0, onClick: () => setStep("payment"), children: "Fechar" }),
          step === "payment" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-lg border bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-semibold", children: "Forma de pagamento" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(RadioGroup, { value: paymentKind, onValueChange: (v) => setPaymentKind(v), className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${paymentKind === "cash" ? "border-primary bg-primary/5" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: "cash" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "h-4 w-4" }),
                " Espécie"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${paymentKind === "digital" ? "border-primary bg-primary/5" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: "digital" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-4 w-4" }),
                " Eletrónico"
              ] })
            ] }),
            paymentKind === "cash" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "received", className: "text-sm", children: "Valor entregue" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "received", type: "number", min: 0, step: "0.01", value: received || "", onChange: (e) => setReceived(Math.max(0, Number(e.target.value) || 0)), placeholder: "0,00" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Troco" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-semibold ${received < total ? "text-destructive" : "text-emerald-600"}`, children: formatMZN(change) })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm", children: "Carteira" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroup, { value: wallet, onValueChange: (v) => setWallet(v), className: "space-y-1", children: Object.keys(WALLET_LABELS).map((w) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${wallet === w ? "border-primary bg-primary/5" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RadioGroupItem, { value: w }),
                w === "bank" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-4 w-4" }),
                WALLET_LABELS[w]
              ] }, w)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", size: "lg", disabled: paymentKind === "cash" && received < total, onClick: () => setStep("receipt"), children: "Avançar" })
          ] }),
          step === "receipt" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-lg border bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-4 w-4" }),
              " Pré-visualização do recibo"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center overflow-auto rounded-md bg-background p-2", children: settings && /* @__PURE__ */ jsxRuntimeExports.jsx(ReceiptBody, { s: settings, items: cart.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unit_label: i.unit_label,
              unit_price: i.unit_price
            })), subtotal, discount, total, paymentLabel, received: paymentKind === "cash" ? received : null, change: paymentKind === "cash" ? change : null, saleId: "PRE-VIEW", operatorName: profile?.full_name ?? user?.email ?? null, at: /* @__PURE__ */ new Date() }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full", size: "lg", disabled: finalize.isPending, onClick: () => finalize.mutate(), children: [
              finalize.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Finalizar venda"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!lastSale, onOpenChange: (o) => {
        if (!o) {
          setLastSale(null);
          resetAll();
        }
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-[min(96vw,640px)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-5 w-5" }),
          " Recibo da venda"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "print-area", className: "flex justify-center overflow-auto rounded-md border bg-muted/30 p-3", children: settings && lastSale && /* @__PURE__ */ jsxRuntimeExports.jsx(ReceiptBody, { s: settings, items: cart.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit_label: i.unit_label,
          unit_price: i.unit_price
        })), subtotal, discount, total, paymentLabel, received: paymentKind === "cash" ? received : null, change: paymentKind === "cash" ? change : null, saleId: lastSale.id, receiptNumber: lastSale.receipt_number, operatorName: profile?.full_name ?? user?.email ?? null, at: lastSale.at }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: printReceipt, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "mr-2 h-4 w-4" }),
            " Imprimir"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => {
            setLastSale(null);
            resetAll();
          }, children: "Nova venda" })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  VendasPage as component
};
