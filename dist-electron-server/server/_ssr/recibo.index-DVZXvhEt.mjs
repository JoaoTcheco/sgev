import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle } from "./card-DQ5v2DYb.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { u as useBarcodeScanner } from "./use-barcode-scanner-C7zwwjGv.mjs";
import { Y as ScanLine, R as Receipt, h as Search } from "../_libs/lucide-react.mjs";
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
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
function ReciboLookup() {
  const navigate = useNavigate();
  const [ref, setRef] = reactExports.useState("");
  const [listening, setListening] = reactExports.useState(true);
  useBarcodeScanner((code) => {
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
  reactExports.useEffect(() => {
    setListening(true);
  }, []);
  function go(e) {
    e.preventDefault();
    const v = ref.trim();
    if (!v) return;
    navigate({
      to: "/recibo/$ref",
      params: {
        ref: v
      }
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-xl space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-emerald-500/40 bg-emerald-500/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-center gap-3 py-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: `h-5 w-5 ${listening ? "text-emerald-600 animate-pulse" : "text-muted-foreground"}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: "Leitor de código de barras ativo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Aponte o leitor para o recibo — a validação abre automaticamente." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-5 w-5" }),
        " Validar recibo"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Introduza o número (ex.: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "REC-2026-000001" }),
          ") ou utilize o leitor de código de barras impresso no recibo."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: go, className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: ref, onChange: (e) => setRef(e.target.value), placeholder: "REC-2026-000001", className: "pl-9", autoFocus: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: "Procurar" })
        ] })
      ] })
    ] })
  ] });
}
export {
  ReciboLookup as component
};
