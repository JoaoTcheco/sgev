import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { a as useQueryClient, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-D9M-ftIG.mjs";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { S as Switch } from "./switch-CQ4rbtn8.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CZRUt5a6.mjs";
import { S as Separator } from "./separator-DGgIueqr.mjs";
import { u as useAuthUser, a as useUserRoles, h as highestRole } from "./use-auth-ButDQezc.mjs";
import { n as formatDateTime, f as formatMZN, G as Barcode, L as receiptWidthClass, e as usePharmacySettings } from "./router-DE-fAUtY.mjs";
import { u as useLabelSettings, p as printLabels, D as DEFAULT_LABEL_SETTINGS } from "./print-labels-BvMnthcE.mjs";
import "../_libs/jsbarcode.mjs";
import { L as LoaderCircle, p as Lock, g as Settings, y as Save, n as Printer, z as RotateCcw } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
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
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-separator.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
function ConfiguracoesPage() {
  const {
    user
  } = useAuthUser();
  const {
    data: roles = []
  } = useUserRoles(user?.id);
  const isAdmin = highestRole(roles) === "admin";
  const {
    data: settings,
    isLoading
  } = usePharmacySettings();
  const queryClient = useQueryClient();
  const [form, setForm] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);
  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const {
        error
      } = await supabase.from("pharmacy_settings").update({
        name: form.name,
        slogan: form.slogan,
        nuit: form.nuit,
        address: form.address,
        city: form.city,
        phone: form.phone,
        email: form.email,
        website: form.website,
        logo_url: form.logo_url,
        receipt_width: form.receipt_width,
        receipt_header: form.receipt_header,
        receipt_footer: form.receipt_footer,
        show_pharmacist: form.show_pharmacist
      }).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações guardadas");
      queryClient.invalidateQueries({
        queryKey: ["pharmacy-settings"]
      });
    },
    onError: (e) => toast.error("Falha ao guardar", {
      description: e.message
    })
  });
  if (isLoading || !form) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) });
  }
  const set = (k, v) => setForm((p) => p ? {
    ...p,
    [k]: v
  } : p);
  const disabled = !isAdmin;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      !isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-amber-500/40 bg-amber-500/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-center gap-2 py-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-4 w-4" }),
        " Apenas administradores podem alterar estas configurações."
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-5 w-5" }),
          " Dados da farmácia"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Nome", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.name, onChange: (e) => set("name", e.target.value), disabled }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Slogan", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.slogan ?? "", onChange: (e) => set("slogan", e.target.value), disabled }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "NUIT", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.nuit ?? "", onChange: (e) => set("nuit", e.target.value), disabled }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Telefone", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.phone ?? "", onChange: (e) => set("phone", e.target.value), disabled }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Email", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", value: form.email ?? "", onChange: (e) => set("email", e.target.value), disabled }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Website", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.website ?? "", onChange: (e) => set("website", e.target.value), disabled }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Endereço", full: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.address ?? "", onChange: (e) => set("address", e.target.value), disabled }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Cidade / País", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.city ?? "", onChange: (e) => set("city", e.target.value), disabled }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "URL do logótipo", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.logo_url ?? "", placeholder: "https://…", onChange: (e) => set("logo_url", e.target.value), disabled }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Recibo" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tamanho do papel", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.receipt_width, onValueChange: (v) => set("receipt_width", v), disabled, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "58mm", children: "Térmico 58 mm" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "80mm", children: "Térmico 80 mm" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "a4", children: "Folha A4" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Mostrar nome do operador", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: form.show_pharmacist, onCheckedChange: (v) => set("show_pharmacist", v), disabled }) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Cabeçalho extra (opcional)", full: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 2, value: form.receipt_header ?? "", onChange: (e) => set("receipt_header", e.target.value), disabled, placeholder: "Ex.: Licença sanitária nº 123/2026" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Rodapé / mensagem final", full: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 2, value: form.receipt_footer ?? "", onChange: (e) => set("receipt_footer", e.target.value), disabled }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LabelSettingsCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BackupCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => save.mutate(), disabled: disabled || save.isPending, size: "lg", children: [
        save.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
        "Guardar alterações"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "self-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Pré-visualização do recibo" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center rounded-lg bg-muted/40 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ReceiptPreview, { s: form }) }) })
    ] })
  ] });
}
function Field({
  label,
  children,
  full
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `space-y-1.5 ${full ? "md:col-span-2" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-medium text-muted-foreground", children: label }),
    children
  ] });
}
function ReceiptPreview({
  s
}) {
  const sampleItems = [{
    name: "Paracetamol 500mg",
    qty: 2,
    unit: "cx",
    price: 150
  }, {
    name: "Amoxicilina 250mg",
    qty: 1,
    unit: "carteira",
    price: 85
  }];
  const subtotal = sampleItems.reduce((s2, i) => s2 + i.qty * i.price, 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ReceiptBody, { s, items: sampleItems.map((i) => ({
    name: i.name,
    quantity: i.qty,
    unit_label: i.unit,
    unit_price: i.price
  })), subtotal, discount: 0, total: subtotal, paymentLabel: "M-Pesa", received: null, change: null, saleId: "PREVIEW-0001", operatorName: "Operador Exemplo", at: /* @__PURE__ */ new Date() });
}
function ReceiptBody(props) {
  const {
    s,
    items,
    subtotal,
    discount,
    total,
    paymentLabel,
    received,
    change,
    saleId,
    receiptNumber,
    operatorName,
    at
  } = props;
  const ref = receiptNumber || `REC-${saleId.slice(0, 8).toUpperCase()}`;
  const barcodeHeight = s.receipt_width === "a4" ? 70 : s.receipt_width === "58mm" ? 45 : 55;
  const barcodeWidth = s.receipt_width === "58mm" ? 0.9 : s.receipt_width === "80mm" ? 1.2 : 2;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${receiptWidthClass(s.receipt_width)} bg-white p-3 font-mono leading-snug text-black shadow-sm`, children: [
    s.logo_url && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: s.logo_url, alt: s.name, className: "max-h-14 object-contain" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-base font-bold tracking-tight", children: s.name }),
      s.slogan && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] italic opacity-80", children: s.slogan }),
      s.address && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px]", children: s.address }),
      s.city && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px]", children: s.city }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px]", children: [
        s.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Tel: ",
          s.phone
        ] }),
        s.phone && s.email && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: " · " }),
        s.email && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: s.email })
      ] }),
      s.nuit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px]", children: [
        "NUIT: ",
        s.nuit
      ] }),
      s.receipt_header && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[10px] whitespace-pre-line", children: s.receipt_header })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center font-bold", children: "RECIBO DE VENDA" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Nº ",
        ref
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatDateTime(at) })
    ] }),
    s.show_pharmacist && operatorName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px]", children: [
      "Operador: ",
      operatorName
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left text-[10px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-0.5", children: "Descrição" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-0.5 text-right", children: "Qtd" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-0.5 text-right", children: "P.Unit" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-0.5 text-right", children: "Total" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "align-top", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-0.5 pr-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "leading-tight", children: it.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[9px] opacity-70", children: [
            "(",
            it.unit_label,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right", children: it.quantity }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right", children: formatMZN(it.unit_price) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right", children: formatMZN(it.quantity * it.unit_price) })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Subtotal", value: formatMZN(subtotal) }),
    discount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Desconto", value: `− ${formatMZN(discount)}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "TOTAL", value: formatMZN(total), bold: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Pagamento", value: paymentLabel }),
    received != null && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Entregue", value: formatMZN(received) }),
    change != null && /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Troco", value: formatMZN(change), bold: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "barcode-block w-full bg-white px-1 py-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Barcode, { value: ref, height: barcodeHeight, width: barcodeWidth, displayValue: false }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-center text-[11px] font-mono font-bold tracking-widest", children: ref }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-[9px] opacity-70", children: "Leia o código de barras para validar este recibo" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dashed, {}),
    s.receipt_footer && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-[10px] whitespace-pre-line", children: s.receipt_footer }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-center text-[9px] opacity-70", children: [
      "Documento não fiscal · ",
      s.name
    ] })
  ] });
}
function Row({
  label,
  value,
  bold
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex justify-between ${bold ? "font-bold" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: value })
  ] });
}
function Dashed() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-1 border-t border-dashed border-black/60" });
}
function LabelSettingsCard() {
  const {
    settings,
    update,
    reset
  } = useLabelSettings();
  const sample = {
    name: "Paracetamol 500mg",
    barcode: "2000000001234",
    price: 120,
    batch_number: "L240115",
    expiry_date: "2027-08-31",
    qty: 1
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "h-5 w-5" }),
      " Etiquetas e impressora"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Modo de impressão", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: settings.mode, onValueChange: (v) => update({
          mode: v
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "a4", children: "Folha A4 (grelha)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "thermal", children: "Impressora térmica (rolo)" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Impressora preferida (sugestão)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: settings.printerName, onChange: (e) => update({
          printerName: e.target.value
        }), placeholder: "Ex.: Zebra ZD220 / HP LaserJet" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "A escolha da impressora é feita na janela de impressão do navegador. O nome acima aparece como dica antes de imprimir." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
      settings.mode === "a4" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold", children: "Layout A4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Colunas", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, max: 6, value: settings.a4.columns, onChange: (e) => update((s) => ({
            ...s,
            a4: {
              ...s.a4,
              columns: clamp(Number(e.target.value), 1, 6)
            }
          })) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Margem (mm)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, max: 30, value: settings.a4.marginMm, onChange: (e) => update((s) => ({
            ...s,
            a4: {
              ...s.a4,
              marginMm: clamp(Number(e.target.value), 0, 30)
            }
          })) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Espaço entre (mm)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, max: 20, value: settings.a4.gapMm, onChange: (e) => update((s) => ({
            ...s,
            a4: {
              ...s.a4,
              gapMm: clamp(Number(e.target.value), 0, 20)
            }
          })) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Altura etiqueta (mm)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 15, max: 80, value: settings.a4.labelHeightMm, onChange: (e) => update((s) => ({
            ...s,
            a4: {
              ...s.a4,
              labelHeightMm: clamp(Number(e.target.value), 15, 80)
            }
          })) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleField, { label: "Mostrar preço", checked: settings.a4.showPrice, onChange: (v) => update((s) => ({
            ...s,
            a4: {
              ...s.a4,
              showPrice: v
            }
          })) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleField, { label: "Mostrar lote", checked: settings.a4.showBatch, onChange: (v) => update((s) => ({
            ...s,
            a4: {
              ...s.a4,
              showBatch: v
            }
          })) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleField, { label: "Mostrar validade", checked: settings.a4.showExpiry, onChange: (v) => update((s) => ({
            ...s,
            a4: {
              ...s.a4,
              showExpiry: v
            }
          })) })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold", children: "Etiqueta térmica" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Largura (mm)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 20, max: 110, value: settings.thermal.widthMm, onChange: (e) => update((s) => ({
            ...s,
            thermal: {
              ...s.thermal,
              widthMm: clamp(Number(e.target.value), 20, 110)
            }
          })) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Altura (mm)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 15, max: 100, value: settings.thermal.heightMm, onChange: (e) => update((s) => ({
            ...s,
            thermal: {
              ...s.thermal,
              heightMm: clamp(Number(e.target.value), 15, 100)
            }
          })) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Margem interna (mm)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, max: 10, value: settings.thermal.marginMm, onChange: (e) => update((s) => ({
            ...s,
            thermal: {
              ...s.thermal,
              marginMm: clamp(Number(e.target.value), 0, 10)
            }
          })) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Altura do código (mm)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 6, max: 40, value: settings.thermal.barcodeHeightMm, onChange: (e) => update((s) => ({
            ...s,
            thermal: {
              ...s.thermal,
              barcodeHeightMm: clamp(Number(e.target.value), 6, 40)
            }
          })) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tamanho fonte (pt)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 6, max: 16, value: settings.thermal.fontSizePt, onChange: (e) => update((s) => ({
            ...s,
            thermal: {
              ...s.thermal,
              fontSizePt: clamp(Number(e.target.value), 6, 16)
            }
          })) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleField, { label: "Mostrar preço", checked: settings.thermal.showPrice, onChange: (v) => update((s) => ({
            ...s,
            thermal: {
              ...s.thermal,
              showPrice: v
            }
          })) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleField, { label: "Mostrar lote", checked: settings.thermal.showBatch, onChange: (v) => update((s) => ({
            ...s,
            thermal: {
              ...s.thermal,
              showBatch: v
            }
          })) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleField, { label: "Mostrar validade", checked: settings.thermal.showExpiry, onChange: (v) => update((s) => ({
            ...s,
            thermal: {
              ...s.thermal,
              showExpiry: v
            }
          })) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: 'Dica: na janela de impressão, escolha a impressora térmica e defina margens "Nenhuma" e escala "100%" para alinhar ao rolo.' })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Configurações guardadas localmente neste dispositivo." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => reset(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-1 h-4 w-4" }),
            " Repor padrão"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => printLabels([sample]), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "mr-1 h-4 w-4" }),
            " Imprimir teste"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-muted/30 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2 text-xs font-medium text-muted-foreground", children: [
          "Pré-visualização (",
          settings.mode === "a4" ? `A4 · ${settings.a4.columns} colunas` : `${settings.thermal.widthMm}×${settings.thermal.heightMm} mm`,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LabelPreview, {})
      ] })
    ] })
  ] });
}
function LabelPreview() {
  const {
    settings
  } = useLabelSettings();
  if (settings.mode === "thermal") {
    const {
      widthMm,
      heightMm,
      marginMm,
      barcodeHeightMm,
      fontSizePt,
      showPrice: showPrice2,
      showBatch: showBatch2,
      showExpiry: showExpiry2
    } = settings.thermal;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center bg-white p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      width: `${widthMm * 3}px`,
      height: `${heightMm * 3}px`,
      padding: `${marginMm * 3}px`,
      fontSize: `${fontSizePt}pt`
    }, className: "flex flex-col items-center justify-center overflow-hidden border border-dashed border-zinc-300 text-zinc-900", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold leading-tight", children: "Paracetamol 500mg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        height: `${barcodeHeightMm * 3}px`,
        width: "100%"
      }, className: "my-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Barcode, { value: "2000000001234", height: barcodeHeightMm * 3, displayValue: false }) }),
      (showBatch2 || showExpiry2) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full justify-between text-[8pt]", children: [
        showBatch2 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "L:240115" }),
        showExpiry2 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "V:31/08/27" })
      ] }),
      showPrice2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-extrabold", children: formatMZN(120) })
    ] }) });
  }
  const {
    columns,
    gapMm,
    labelHeightMm,
    showPrice,
    showBatch,
    showExpiry
  } = settings.a4.columns ? settings.a4 : DEFAULT_LABEL_SETTINGS.a4;
  const cells = Array.from({
    length: columns * 2
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white p-3", style: {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gapMm * 2}px`
  }, children: cells.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    height: `${labelHeightMm * 2}px`
  }, className: "flex flex-col items-center justify-center overflow-hidden border border-dashed border-zinc-300 p-1 text-[9px] text-zinc-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Paracetamol 500mg" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full", style: {
      height: "40%"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Barcode, { value: "2000000001234", height: Math.max(20, labelHeightMm), displayValue: false }) }),
    (showBatch || showExpiry) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full justify-between text-[7px]", children: [
      showBatch && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Lote: 240115" }),
      showExpiry && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Val: 31/08/27" })
    ] }),
    showPrice && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: formatMZN(120) })
  ] }, i)) });
}
function ToggleField({
  label,
  checked,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked, onCheckedChange: onChange }),
    label
  ] });
}
function BackupCard() {
  const desktop = typeof window !== "undefined" && !!window.pharmasys;
  const bridge = window.pharmasys;
  async function doBackup() {
    if (!bridge) return;
    const r = await bridge.backupNow();
    if (r.ok) toast.success("Backup guardado", {
      description: r.path
    });
  }
  async function doRestore() {
    if (!bridge) return;
    if (!window.confirm("Tem a certeza? A base de dados actual será substituída e a aplicação reinicia.")) return;
    await bridge.restoreBackup();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-5 w-5" }),
      " Backup e restauro"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3 text-sm", children: !desktop ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Disponível apenas na versão desktop (Electron). No browser os dados estão na nuvem." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "A base de dados local é guardada automaticamente quando fecha a aplicação. Recomenda-se também backup manual periódico para pen ou disco externo." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: doBackup, variant: "default", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-2 h-4 w-4" }),
          " Backup agora"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => bridge?.openBackupsFolder(), variant: "outline", children: "Abrir pasta de backups" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: doRestore, variant: "destructive", children: "Restaurar de ficheiro…" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => bridge?.openLogsFolder?.(), variant: "outline", children: "Abrir pasta de logs" })
      ] })
    ] }) })
  ] });
}
function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
export {
  ReceiptBody,
  ConfiguracoesPage as component
};
