import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { h as findProductByBarcode, f as formatMZN, C as addBatchEntry, I as listEntradaProducts, A as listSuppliersMin } from "./router-DE-fAUtY.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { S as Separator } from "./separator-DGgIueqr.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { u as useBarcodeScanner } from "./use-barcode-scanner-C7zwwjGv.mjs";
import { p as printLabels } from "./print-labels-BvMnthcE.mjs";
import { R as RoleGate } from "./role-gate-WPjeBQ_g.mjs";
import "../_libs/jsbarcode.mjs";
import { e as PackagePlus, h as Search, L as LoaderCircle, k as Plus, x as CircleCheck, T as TriangleAlert, n as Printer, i as Trash2 } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
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
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-separator.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "./use-auth-ButDQezc.mjs";
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function EntradaPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = reactExports.useState("");
  const [rows, setRows] = reactExports.useState([]);
  const [defaultSupplier, setDefaultSupplier] = reactExports.useState("");
  const [invoiceRef, setInvoiceRef] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const lastFocusRef = reactExports.useRef(null);
  const {
    data: products = [],
    isLoading
  } = useQuery({
    queryKey: ["entrada-products", search],
    queryFn: () => listEntradaProducts(search)
  });
  const {
    data: suppliers = []
  } = useQuery({
    queryKey: ["suppliers-min"],
    queryFn: () => listSuppliersMin()
  });
  const addProduct = reactExports.useCallback((p) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.product_id === p.id && r.status !== "saved");
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + 1
        };
        return next;
      }
      return [...prev, {
        uid: uid(),
        product_id: p.id,
        name: p.name,
        barcode: p.barcode,
        sale_price: Number(p.sale_price ?? 0),
        batch_number: "",
        expiry_date: "",
        quantity: 1,
        cost_price: 0,
        supplier_id: defaultSupplier || null,
        status: "pending"
      }];
    });
  }, [defaultSupplier]);
  useBarcodeScanner(async (code) => {
    try {
      const data = await findProductByBarcode(code);
      if (!data) {
        toast.error(`Código ${code} não encontrado`);
        return;
      }
      addProduct({
        id: data.id,
        name: data.name,
        barcode: data.barcode ?? null,
        sale_price: data.sale_price
      });
      toast.success(`+ ${data.name}`);
    } catch (e) {
      toast.error("Falha na busca", {
        description: e.message
      });
    }
  });
  function updateRow(uid2, patch) {
    setRows((prev) => prev.map((r) => r.uid === uid2 ? {
      ...r,
      ...patch
    } : r));
  }
  function removeRow(uid2) {
    setRows((prev) => prev.filter((r) => r.uid !== uid2));
  }
  const pending = reactExports.useMemo(() => rows.filter((r) => r.status !== "saved"), [rows]);
  const totalCost = reactExports.useMemo(() => rows.reduce((s, r) => s + r.cost_price * r.quantity, 0), [rows]);
  function validateRow(r) {
    if (!r.batch_number.trim()) return "Lote obrigatório";
    if (!r.expiry_date) return "Validade obrigatória";
    if (r.quantity <= 0) return "Quantidade inválida";
    if (r.cost_price < 0) return "Custo inválido";
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (r.expiry_date < today) return "Validade no passado";
    return null;
  }
  async function confirmAll() {
    if (pending.length === 0) {
      toast.error("Sem itens pendentes");
      return;
    }
    for (const r of pending) {
      const err = validateRow(r);
      if (err) {
        toast.error(`${r.name}: ${err}`);
        return;
      }
    }
    setSaving(true);
    let okCount = 0;
    for (const r of pending) {
      try {
        await addBatchEntry({
          product_id: r.product_id,
          supplier_id: r.supplier_id ?? defaultSupplier ?? null,
          batch_number: r.batch_number.trim(),
          expiry_date: r.expiry_date,
          quantity: Math.floor(r.quantity),
          cost_price: r.cost_price
        });
        updateRow(r.uid, {
          status: "saved"
        });
        okCount++;
      } catch (e) {
        updateRow(r.uid, {
          status: "error",
          error: e.message
        });
      }
    }
    setSaving(false);
    if (okCount > 0) {
      toast.success(`${okCount} entrada(s) registada(s)${invoiceRef ? ` · NF ${invoiceRef}` : ""}`);
      queryClient.invalidateQueries({
        queryKey: ["stock"]
      });
      queryClient.invalidateQueries({
        queryKey: ["pdv-products"]
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard"]
      });
    }
    if (okCount < pending.length) toast.error("Alguns itens falharam — reveja a tabela.");
  }
  function printRowLabels(r) {
    if (!r.barcode) {
      toast.error("Produto sem código de barras — atribua em Estoque.");
      return;
    }
    printLabels([{
      name: r.name,
      barcode: r.barcode,
      price: r.sale_price,
      batch_number: r.batch_number,
      expiry_date: r.expiry_date,
      qty: Math.min(120, Math.max(1, r.quantity))
    }]);
  }
  function printAllSaved() {
    const saved = rows.filter((r) => r.status === "saved" && r.barcode);
    if (saved.length === 0) {
      toast.error("Nada para imprimir");
      return;
    }
    printLabels(saved.map((r) => ({
      name: r.name,
      barcode: r.barcode,
      price: r.sale_price,
      batch_number: r.batch_number,
      expiry_date: r.expiry_date,
      qty: Math.min(120, Math.max(1, r.quantity))
    })));
  }
  function newEntry() {
    if (saving) return;
    setRows([]);
    setInvoiceRef("");
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-[1fr_460px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PackagePlus, { className: "h-5 w-5" }),
            " Entrada de mercadoria"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Pesquise produtos ou use o leitor de código de barras para montar a entrada." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-72", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { ref: lastFocusRef, value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Nome, fabricante, código…", className: "pl-9" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : products.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-10 text-center text-sm text-muted-foreground", children: "Sem resultados." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-2 md:grid-cols-2", children: products.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => addProduct(p), className: "flex items-center justify-between gap-2 rounded-lg border p-2 text-left hover:bg-muted/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: p.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "truncate text-xs text-muted-foreground", children: [
            p.manufacturer ?? "—",
            " ",
            p.barcode ? `· ${p.barcode}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 shrink-0 text-muted-foreground" })
      ] }, p.id)) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "self-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Conferência da nota" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "nf", children: "Nº da NF / referência" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "nf", value: invoiceRef, onChange: (e) => setInvoiceRef(e.target.value), placeholder: "NF-1234" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Fornecedor padrão" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: defaultSupplier || void 0, onValueChange: (v) => setDefaultSupplier(v), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Opcional" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: suppliers.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.id, children: s.legal_name }, s.id)) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
        rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-6 text-center text-sm text-muted-foreground", children: "Adicione produtos à esquerda ou escaneie um código." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg border p-2 ${r.status === "saved" ? "border-emerald-500/50 bg-emerald-500/5" : r.status === "error" ? "border-destructive/50 bg-destructive/5" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: r.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: r.barcode ?? "sem código" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              r.status === "saved" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-emerald-600 hover:bg-emerald-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mr-1 h-3 w-3" }),
                "OK"
              ] }),
              r.status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "destructive", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "mr-1 h-3 w-3" }),
                "Erro"
              ] }),
              r.status === "saved" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", title: "Imprimir etiquetas", onClick: () => printRowLabels(r), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-4 w-4" }) }),
              r.status !== "saved" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", title: "Remover", onClick: () => removeRow(r.uid), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Lote" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: r.batch_number, disabled: r.status === "saved", onChange: (e) => updateRow(r.uid, {
                batch_number: e.target.value
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Validade" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: r.expiry_date, disabled: r.status === "saved", onChange: (e) => updateRow(r.uid, {
                expiry_date: e.target.value
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Qtd (un)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, value: r.quantity, disabled: r.status === "saved", onChange: (e) => updateRow(r.uid, {
                quantity: Math.max(1, Number(e.target.value) || 1)
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Custo unit." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.01", min: 0, value: r.cost_price, disabled: r.status === "saved", onChange: (e) => updateRow(r.uid, {
                cost_price: Math.max(0, Number(e.target.value) || 0)
              }) })
            ] })
          ] }),
          r.status === "error" && r.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-destructive", children: r.error })
        ] }, r.uid)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Total estimado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: formatMZN(totalCost) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1", disabled: saving || pending.length === 0, onClick: confirmAll, children: [
            saving && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
            "Confirmar entrada"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", disabled: !rows.some((r) => r.status === "saved"), onClick: printAllSaved, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "mr-1 h-4 w-4" }),
            " Etiquetas"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: newEntry, disabled: saving, children: "Nova" })
        ] })
      ] })
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(RoleGate, { allow: ["admin", "pharmacist"], children: /* @__PURE__ */ jsxRuntimeExports.jsx(EntradaPage, {}) });
export {
  SplitComponent as component
};
