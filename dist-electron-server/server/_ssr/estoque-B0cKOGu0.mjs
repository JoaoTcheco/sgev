import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-RrXKMtST.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-8XiXuMbO.mjs";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DdaAQQFU.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { S as Switch } from "./switch-CQ4rbtn8.mjs";
import { C as addBatchEntry, D as saveProduct, E as deleteOrDisableProduct, f as formatMZN, s as formatDate, F as assignProductBarcode, G as Barcode$1, z as listStockProducts, A as listSuppliersMin, B as listCategoriesMin } from "./router-DE-fAUtY.mjs";
import { u as useAuthUser, a as useUserRoles, h as highestRole } from "./use-auth-ButDQezc.mjs";
import { R as RoleGate } from "./role-gate-WPjeBQ_g.mjs";
import "../_libs/jsbarcode.mjs";
import { d as Package, h as Search, k as Plus, L as LoaderCircle, u as Barcode, t as Pencil, i as Trash2, n as Printer } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
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
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/radix-ui__react-alert-dialog.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/radix-ui__react-switch.mjs";
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
import "../_libs/supabase__functions-js.mjs";
function generateBarcode() {
  const ts = Date.now().toString().slice(-10);
  const rnd = Math.floor(Math.random() * 1e3).toString().padStart(3, "0");
  return ts + rnd;
}
function EstoquePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = reactExports.useState("");
  const [batchOpen, setBatchOpen] = reactExports.useState(null);
  const [productOpen, setProductOpen] = reactExports.useState(null);
  const [deleteOpen, setDeleteOpen] = reactExports.useState(null);
  const [barcodeOpen, setBarcodeOpen] = reactExports.useState(null);
  const [printQty, setPrintQty] = reactExports.useState(12);
  const {
    user
  } = useAuthUser();
  const {
    data: roles = []
  } = useUserRoles(user?.id);
  const role = highestRole(roles);
  const canManage = role === "admin" || role === "pharmacist";
  const {
    data: rows = [],
    isLoading
  } = useQuery({
    queryKey: ["stock", search],
    queryFn: () => listStockProducts(search)
  });
  const {
    data: suppliers = []
  } = useQuery({
    queryKey: ["suppliers-min"],
    queryFn: () => listSuppliersMin()
  });
  const {
    data: categories = []
  } = useQuery({
    queryKey: ["categories-min"],
    queryFn: () => listCategoriesMin()
  });
  const addBatch = useMutation({
    mutationFn: (payload) => addBatchEntry(payload),
    onSuccess: () => {
      toast.success("Lote registado");
      setBatchOpen(null);
      queryClient.invalidateQueries({
        queryKey: ["stock"]
      });
    },
    onError: (e) => toast.error("Falha", {
      description: e.message
    })
  });
  const saveProduct$1 = useMutation({
    mutationFn: (p) => saveProduct({
      id: p.id,
      name: p.name,
      manufacturer: p.manufacturer || null,
      unit: p.unit || "cx",
      pack_size: Number(p.pack_size || 1),
      min_stock: Number(p.min_stock || 0),
      ideal_stock: Number(p.ideal_stock || 0),
      cost_price: Number(p.cost_price || 0),
      sale_price: Number(p.sale_price || 0),
      tarja: p.tarja || null,
      active: p.active ?? true,
      barcode: p.barcode?.trim() || generateBarcode(),
      category_id: p.category_id || null,
      active_ingredient: p.active_ingredient || null,
      requires_prescription: p.requires_prescription ?? false,
      sub_unit_label: p.sub_unit_label || null,
      sub_unit_price: p.sub_unit_price ? Number(p.sub_unit_price) : null
    }),
    onSuccess: () => {
      toast.success("Produto guardado");
      setProductOpen(null);
      queryClient.invalidateQueries({
        queryKey: ["stock"]
      });
    },
    onError: (e) => toast.error("Falha", {
      description: e.message
    })
  });
  const deleteProduct = useMutation({
    mutationFn: (id) => deleteOrDisableProduct(id),
    onSuccess: (r) => {
      toast.success(r === "deleted" ? "Produto eliminado" : "Produto desativado (possui histórico)");
      setDeleteOpen(null);
      queryClient.invalidateQueries({
        queryKey: ["stock"]
      });
    },
    onError: (e) => toast.error("Falha", {
      description: e.message
    })
  });
  function totalUnits(batches) {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    return (batches ?? []).filter((b) => b.expiry_date >= today).reduce((s, b) => s + b.quantity, 0);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-5 w-5" }),
            " Estoque"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Produtos, lotes, validade e códigos de barras." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-72", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Pesquisar produto, código…", className: "pl-9" })
          ] }),
          canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setProductOpen("new"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-4 w-4" }),
            " Novo produto"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Produto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Tarja" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Estoque" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Mín." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Custo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Venda" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Próx. validade" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Ações" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableBody, { children: [
          rows.map((p) => {
            const units = totalUnits(p.batches);
            const nextExpiry = (p.batches ?? []).filter((b) => b.quantity > 0).map((b) => b.expiry_date).sort()[0];
            const low = units <= p.min_stock;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: p.active ? "" : "opacity-60", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium", children: [
                  p.name,
                  " ",
                  !p.active && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "ml-1", children: "inativo" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  p.manufacturer ?? "—",
                  " ",
                  p.barcode ? `· ${p.barcode}` : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: p.tarja ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: p.tarja }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "livre" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: `text-right ${low ? "text-destructive font-semibold" : ""}`, children: units }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: p.min_stock }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: formatMZN(p.cost_price) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: formatMZN(p.sale_price) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: formatDate(nextExpiry) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", title: "Código de barras", onClick: () => {
                  setBarcodeOpen(p);
                  setPrintQty(12);
                }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Barcode, { className: "h-4 w-4" }) }),
                canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => setBatchOpen(p.id), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-3 w-3" }),
                    " Lote"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", title: "Editar", onClick: () => setProductOpen(p), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", title: "Eliminar", onClick: () => setDeleteOpen(p), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
                ] })
              ] }) })
            ] }, p.id);
          }),
          rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 8, className: "py-10 text-center text-muted-foreground", children: "Sem produtos." }) })
        ] })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!batchOpen, onOpenChange: (o) => !o && setBatchOpen(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Entrada de lote" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("form", { id: "batch-form", className: "space-y-3", onSubmit: (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        addBatch.mutate({
          product_id: batchOpen,
          supplier_id: f.get("supplier_id") || null,
          batch_number: String(f.get("batch_number") || ""),
          expiry_date: String(f.get("expiry_date") || ""),
          quantity: Number(f.get("quantity") || 0),
          cost_price: Number(f.get("cost_price") || 0)
        });
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "batch_number", children: "Número do lote" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "batch_number", name: "batch_number", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expiry_date", children: "Validade" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "expiry_date", name: "expiry_date", type: "date", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "quantity", children: "Quantidade (un)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "quantity", name: "quantity", type: "number", min: 1, required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cost_price", children: "Custo unitário" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "cost_price", name: "cost_price", type: "number", step: "0.01", min: 0, required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Fornecedor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { name: "supplier_id", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecionar (opcional)" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: suppliers.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.id, children: s.legal_name }, s.id)) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", form: "batch-form", disabled: addBatch.isPending, children: [
        addBatch.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        "Registar"
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ProductDialog, { open: productOpen, onClose: () => setProductOpen(null), categories, onSubmit: (p) => saveProduct$1.mutate(p), saving: saveProduct$1.isPending }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!deleteOpen, onOpenChange: (o) => !o && setDeleteOpen(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Eliminar produto?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          deleteOpen?.name,
          ". Se houver histórico associado, o produto será desativado em vez de eliminado."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => deleteOpen && deleteProduct.mutate(deleteOpen.id), children: "Eliminar" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BarcodeDialog, { product: barcodeOpen, qty: printQty, setQty: setPrintQty, onClose: () => setBarcodeOpen(null), onAssign: async (code) => {
      if (!barcodeOpen) return;
      try {
        await assignProductBarcode(barcodeOpen.id, code);
        toast.success("Código atribuído");
        queryClient.invalidateQueries({
          queryKey: ["stock"]
        });
        setBarcodeOpen({
          ...barcodeOpen,
          barcode: code
        });
      } catch (e) {
        toast.error("Falha", {
          description: e.message
        });
      }
    } })
  ] });
}
function ProductDialog({
  open,
  onClose,
  categories,
  onSubmit,
  saving
}) {
  const editing = open && open !== "new" ? open : null;
  const isOpen = !!open;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isOpen, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Editar produto" : "Novo produto" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("form", { id: "product-form", className: "space-y-3", onSubmit: (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      onSubmit({
        id: editing?.id,
        name: String(f.get("name") || ""),
        manufacturer: String(f.get("manufacturer") || ""),
        active_ingredient: String(f.get("active_ingredient") || ""),
        unit: String(f.get("unit") || "cx"),
        pack_size: Number(f.get("pack_size") || 1),
        min_stock: Number(f.get("min_stock") || 0),
        ideal_stock: Number(f.get("ideal_stock") || 0),
        cost_price: Number(f.get("cost_price") || 0),
        sale_price: Number(f.get("sale_price") || 0),
        sub_unit_label: String(f.get("sub_unit_label") || ""),
        sub_unit_price: f.get("sub_unit_price") ? Number(f.get("sub_unit_price")) : null,
        tarja: f.get("tarja") || null,
        category_id: f.get("category_id") || null,
        barcode: String(f.get("barcode") || ""),
        requires_prescription: f.get("requires_prescription") === "on",
        active: f.get("active") === "on"
      });
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Nome *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "name", name: "name", required: true, defaultValue: editing?.name ?? "" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "manufacturer", children: "Fabricante" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "manufacturer", name: "manufacturer", defaultValue: editing?.manufacturer ?? "" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "active_ingredient", children: "Princípio ativo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "active_ingredient", name: "active_ingredient", defaultValue: editing?.active_ingredient ?? "" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Categoria" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { name: "category_id", defaultValue: editing?.category_id ?? void 0, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecionar" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c.id, children: c.name }, c.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Tarja" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { name: "tarja", defaultValue: editing?.tarja ?? void 0, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Livre" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "livre", children: "Livre" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "amarela", children: "Amarela" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "vermelha", children: "Vermelha" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "preta", children: "Preta" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "unit", children: "Unidade (cx/fr)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "unit", name: "unit", defaultValue: editing?.unit ?? "cx" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pack_size", children: "Comp./caixa" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pack_size", name: "pack_size", type: "number", min: 1, defaultValue: editing?.pack_size ?? 1 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cost_price", children: "Preço custo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "cost_price", name: "cost_price", type: "number", step: "0.01", min: 0, defaultValue: editing?.cost_price ?? 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sale_price", children: "Preço venda" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "sale_price", name: "sale_price", type: "number", step: "0.01", min: 0, defaultValue: editing?.sale_price ?? 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sub_unit_label", children: "Sub-unidade (ex: comprimido)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "sub_unit_label", name: "sub_unit_label", defaultValue: editing?.sub_unit_label ?? "" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sub_unit_price", children: "Preço sub-unidade" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "sub_unit_price", name: "sub_unit_price", type: "number", step: "0.01", min: 0, defaultValue: editing?.sub_unit_price ?? "" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "min_stock", children: "Estoque mínimo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "min_stock", name: "min_stock", type: "number", min: 0, defaultValue: editing?.min_stock ?? 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "ideal_stock", children: "Estoque ideal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "ideal_stock", name: "ideal_stock", type: "number", min: 0, defaultValue: editing?.ideal_stock ?? 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "barcode", children: "Código de barras (deixe vazio para gerar)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "barcode", name: "barcode", defaultValue: editing?.barcode ?? "", placeholder: "Será gerado automaticamente" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { name: "requires_prescription", defaultChecked: editing?.requires_prescription ?? false }),
        " Requer receita"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { name: "active", defaultChecked: editing?.active ?? true }),
        " Ativo"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", form: "product-form", disabled: saving, children: [
        saving && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        " Guardar"
      ] })
    ] })
  ] }) });
}
function BarcodeDialog({
  product,
  qty,
  setQty,
  onClose,
  onAssign
}) {
  const [code, setCode] = reactExports.useState(product?.barcode ?? "");
  reactExports.useEffect(() => {
    setCode(product?.barcode ?? "");
  }, [product?.id, product?.barcode]);
  function print() {
    if (!product || !product.barcode) {
      toast.error("Atribua um código primeiro");
      return;
    }
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;
    const labels = Array.from({
      length: qty
    }).map(() => `
      <div class="label">
        <div class="name">${escapeHtml(product.name)}</div>
        <svg class="bc"></svg>
        <div class="price">${formatMZN(product.sale_price)}</div>
      </div>
    `).join("");
    w.document.write(`<!doctype html><html><head><title>Etiquetas — ${escapeHtml(product.name)}</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
      <style>
        @page { size: A4; margin: 8mm; }
        body { font-family: system-ui, sans-serif; margin: 0; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
        .label { border: 1px dashed #ccc; padding: 4mm; text-align: center; page-break-inside: avoid; }
        .name { font-size: 11px; font-weight: 600; margin-bottom: 2mm; }
        .bc { width: 100%; height: 40px; }
        .price { font-size: 12px; font-weight: 700; margin-top: 1mm; }
        @media print { .label { border-color: transparent; } }
      </style></head><body>
      <div class="grid">${labels}</div>
      <script>
        window.onload = function(){
          document.querySelectorAll('.bc').forEach(function(svg){
            JsBarcode(svg, ${JSON.stringify(product.barcode)}, { format:'CODE128', height:40, width:1.4, fontSize:10, margin:0 });
          });
          setTimeout(function(){ window.print(); }, 300);
        };
      <\/script></body></html>`);
    w.document.close();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!product, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Código de barras" }) }),
    product && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: product.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: formatMZN(product.sale_price) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: code, onChange: (e) => setCode(e.target.value), placeholder: "Código" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setCode(generateBarcode()), children: "Gerar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => onAssign(code.trim()), disabled: !code.trim() || code === product.barcode, children: "Atribuir" })
      ] }),
      product.barcode ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded border bg-white p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Barcode$1, { value: product.barcode, height: 70 }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Sem código atribuído." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "qty", children: "Quantidade de etiquetas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "qty", type: "number", min: 1, max: 120, value: qty, onChange: (e) => setQty(Number(e.target.value) || 1), className: "w-32" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: print, disabled: !product.barcode, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "mr-2 h-4 w-4" }),
          " Imprimir"
        ] })
      ] })
    ] })
  ] }) });
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(RoleGate, { allow: ["admin", "pharmacist"], children: /* @__PURE__ */ jsxRuntimeExports.jsx(EstoquePage, {}) });
export {
  SplitComponent as component
};
