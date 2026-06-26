import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-RrXKMtST.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-8XiXuMbO.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { R as RoleGate } from "./role-gate-WPjeBQ_g.mjs";
import { y as saveSupplier, x as listSuppliers } from "./router-DE-fAUtY.mjs";
import "../_libs/jsbarcode.mjs";
import { f as Truck, k as Plus, L as LoaderCircle, t as Pencil } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "./use-auth-ButDQezc.mjs";
import "./client-D9M-ftIG.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
function FornecedoresPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = reactExports.useState(null);
  const [open, setOpen] = reactExports.useState(false);
  const {
    data = [],
    isLoading
  } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => listSuppliers()
  });
  const save = useMutation({
    mutationFn: (payload) => saveSupplier(payload),
    onSuccess: () => {
      toast.success("Fornecedor guardado");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({
        queryKey: ["suppliers"]
      });
    },
    onError: (e) => toast.error("Falha", {
      description: e.message
    })
  });
  function onSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    save.mutate({
      id: editing?.id,
      legal_name: String(f.get("legal_name") || ""),
      tax_id: f.get("tax_id") || null,
      contact_name: f.get("contact_name") || null,
      email: f.get("email") || null,
      phone: f.get("phone") || null,
      address: f.get("address") || null,
      active: f.get("active") === "on"
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "h-5 w-5" }),
          " Fornecedores"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Distribuidores e parceiros que abastecem a farmácia." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => {
        setEditing(null);
        setOpen(true);
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
        " Novo fornecedor"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Nome" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "NUIT" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Contacto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Telefone" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Estado" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: data.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium", children: s.legal_name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-sm", children: s.tax_id ?? "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-sm", children: s.contact_name ?? "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-sm", children: s.phone ?? "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: s.active ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { children: "Ativo" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Inativo" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
          setEditing(s);
          setOpen(true);
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" }) }) })
      ] }, s.id)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: (o) => {
      setOpen(o);
      if (!o) setEditing(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing ? "Editar fornecedor" : "Novo fornecedor" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "sup-form", className: "grid grid-cols-2 gap-3", onSubmit, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "legal_name", children: "Nome legal" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "legal_name", name: "legal_name", defaultValue: editing?.legal_name ?? "", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "tax_id", children: "NUIT" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "tax_id", name: "tax_id", defaultValue: editing?.tax_id ?? "" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "contact_name", children: "Contacto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "contact_name", name: "contact_name", defaultValue: editing?.contact_name ?? "" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", children: "E-mail" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", name: "email", type: "email", defaultValue: editing?.email ?? "" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "phone", children: "Telefone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "phone", name: "phone", defaultValue: editing?.phone ?? "" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "address", children: "Morada" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "address", name: "address", defaultValue: editing?.address ?? "" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "col-span-2 flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", name: "active", defaultChecked: editing?.active ?? true }),
          " Ativo"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", form: "sup-form", disabled: save.isPending, children: [
        save.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        " Guardar"
      ] }) })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(RoleGate, { allow: ["admin", "pharmacist"], children: /* @__PURE__ */ jsxRuntimeExports.jsx(FornecedoresPage, {}) });
export {
  SplitComponent as component
};
