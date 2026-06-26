import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { U as Route, e as usePharmacySettings, n as formatDateTime, R as ReceiptBody, V as getSaleByRef } from "./router-DE-fAUtY.mjs";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle } from "./card-DQ5v2DYb.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { u as useBarcodeScanner } from "./use-barcode-scanner-C7zwwjGv.mjs";
import "../_libs/jsbarcode.mjs";
import { A as ArrowLeft, Y as ScanLine, h as Search, L as LoaderCircle, Z as ShieldAlert, r as ShieldCheck, n as Printer } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
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
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
const PAYMENT_LABEL = {
  cash: "Numerário",
  debit: "Cartão Bancário",
  credit: "Cartão de Crédito",
  pix: "M-Pesa",
  other: "e-Mola",
  bank_transfer: "Transferência",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  bank: "Transferência Bancária"
};
function ReciboPage() {
  const {
    ref
  } = Route.useParams();
  const navigate = useNavigate();
  const {
    data: settings
  } = usePharmacySettings();
  const [search, setSearch] = reactExports.useState(ref);
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["sale-by-ref", ref],
    queryFn: () => getSaleByRef(ref)
  });
  useBarcodeScanner((code) => {
    if (code === ref) return;
    toast.success(`Código lido: ${code}`);
    navigate({
      to: "/recibo/$ref",
      params: {
        ref: code
      }
    });
  }, {
    minLength: 6
  });
  const integrity = reactExports.useMemo(() => {
    if (!data) return null;
    const items = data.sale_items ?? [];
    const itemsSum = items.reduce((s, i) => s + Number(i.total), 0);
    const subtotal = Number(data.subtotal);
    const discount = Number(data.discount);
    const total = Number(data.total);
    const eps = 0.01;
    const subtotalOk = Math.abs(itemsSum - subtotal) < eps;
    const totalOk = Math.abs(subtotal - discount - total) < eps;
    const statusOk = data.status === "completed";
    return {
      ok: subtotalOk && totalOk && statusOk,
      subtotalOk,
      totalOk,
      statusOk,
      itemsSum
    };
  }, [data]);
  function lookup(e) {
    e.preventDefault();
    if (!search.trim()) return;
    navigate({
      to: "/recibo/$ref",
      params: {
        ref: search.trim()
      }
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/vendas", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "mr-1 h-4 w-4" }),
        " Voltar a vendas"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden items-center gap-1.5 text-xs text-muted-foreground md:flex", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "h-4 w-4 animate-pulse text-emerald-600" }),
          " Leitor ativo — escaneie outro recibo"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: lookup, className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Nº do recibo (REC-2026-…)", className: "w-72 pl-9" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: "Procurar" })
        ] })
      ] })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : !data ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-destructive/40 bg-destructive/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-center gap-2 py-6 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-5 w-5 text-destructive" }),
      "Recibo ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "rounded bg-background px-1.5 py-0.5", children: ref }),
      " não encontrado ou inválido."
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-[1fr_460px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: integrity?.ok ? "border-emerald-500/50" : "border-amber-500/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "flex items-center gap-2", children: integrity?.ok ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5 text-emerald-600" }),
            " Recibo válido e autenticado"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-5 w-5 text-amber-600" }),
            " Recibo com inconsistências"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: data.status === "completed" ? "default" : "secondary", children: data.status })
        ] }),
        integrity && !integrity.ok && /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs", children: [
          !integrity.statusOk && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Estado da venda não é “completed”." }),
          !integrity.subtotalOk && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            "• Soma dos itens (",
            integrity.itemsSum.toFixed(2),
            " MT) não bate com o subtotal."
          ] }),
          !integrity.totalOk && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Total não corresponde a Subtotal − Desconto." })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Número", children: data.receipt_number ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Data", children: formatDateTime(new Date(data.created_at)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Operador", children: data.operator?.full_name ?? data.operator?.email ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Pagamento", children: PAYMENT_LABEL[data.payment_method] ?? data.payment_method }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Field, { label: "Subtotal", children: [
              Number(data.subtotal).toFixed(2),
              " MT"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Field, { label: "Desconto", children: [
              Number(data.discount).toFixed(2),
              " MT"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Field, { label: "Total", emphasis: true, children: [
              Number(data.total).toFixed(2),
              " MT"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "ID interno", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[11px]", children: data.id }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left", children: "Produto" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "Qtd" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "Unitário" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right", children: "Total" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: (data.sale_items ?? []).map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: it.product_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  it.unit_label,
                  " (",
                  it.unit_kind,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right", children: it.quantity }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right", children: Number(it.unit_price).toFixed(2) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-right font-medium", children: Number(it.total).toFixed(2) })
            ] }, it.id)) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "self-start", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Recibo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => window.print(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "mr-1 h-4 w-4" }),
            " Imprimir"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "print-area", className: "flex justify-center overflow-auto rounded-md bg-muted/30 p-3", children: settings && /* @__PURE__ */ jsxRuntimeExports.jsx(ReceiptBody, { s: settings, items: (data.sale_items ?? []).map((i) => ({
          name: i.product_name,
          quantity: i.quantity,
          unit_label: i.unit_label,
          unit_price: Number(i.unit_price)
        })), subtotal: Number(data.subtotal), discount: Number(data.discount), total: Number(data.total), paymentLabel: PAYMENT_LABEL[data.payment_method] ?? data.payment_method, received: null, change: null, saleId: data.id, receiptNumber: data.receipt_number, operatorName: data.operator?.full_name ?? data.operator?.email ?? null, at: new Date(data.created_at) }) }) })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-destructive", children: error.message })
  ] });
}
function Field({
  label,
  children,
  emphasis
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: emphasis ? "text-base font-semibold" : "text-sm", children })
  ] });
}
export {
  ReciboPage as component
};
