import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as useDesktopAuth, i as isDesktop, n as formatDateTime, f as formatMZN, O as openCashSession, P as closeCashSession, M as listMyCashSessions, N as listSessionSales } from "./router-DE-fAUtY.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { B as Badge } from "./badge-DyfXZgLs.mjs";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-RrXKMtST.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-8XiXuMbO.mjs";
import { u as useAuthUser } from "./use-auth-ButDQezc.mjs";
import "../_libs/jsbarcode.mjs";
import { B as Banknote, J as CircleArrowUp, N as CircleArrowDown, O as Square, Q as Play, L as LoaderCircle, H as History, T as TriangleAlert } from "../_libs/lucide-react.mjs";
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
function CaixaPage() {
  const {
    user
  } = useAuthUser();
  const {
    user: dUser
  } = useDesktopAuth();
  const userId = isDesktop() ? dUser?.id : user?.id;
  const qc = useQueryClient();
  const [openAmt, setOpenAmt] = reactExports.useState("0");
  const [closeOpen, setCloseOpen] = reactExports.useState(false);
  const sessions = useQuery({
    queryKey: ["my-cash-sessions", userId],
    enabled: !!userId,
    queryFn: () => listMyCashSessions(userId)
  });
  const active = sessions.data?.find((s) => s.status === "open") ?? null;
  const liveTotals = useQuery({
    queryKey: ["session-live", active?.id],
    enabled: !!active,
    refetchInterval: 15e3,
    queryFn: async () => {
      const data = await listSessionSales(active.id);
      const cash = data.filter((s) => s.payment_method === "cash").reduce((a, b) => a + Number(b.total), 0);
      const other = data.filter((s) => s.payment_method !== "cash").reduce((a, b) => a + Number(b.total), 0);
      return {
        cash,
        other,
        count: data.length,
        expected: Number(active.opening_amount) + cash
      };
    }
  });
  const openMut = useMutation({
    mutationFn: () => openCashSession(Number(openAmt) || 0),
    onSuccess: () => {
      toast.success("Turno aberto");
      setOpenAmt("0");
      qc.invalidateQueries({
        queryKey: ["my-cash-sessions"]
      });
    },
    onError: (e) => toast.error("Falha", {
      description: e.message
    })
  });
  const [counted, setCounted] = reactExports.useState("");
  const [notes, setNotes] = reactExports.useState("");
  const closeMut = useMutation({
    mutationFn: () => closeCashSession(Number(counted) || 0, notes ?? ""),
    onSuccess: () => {
      toast.success("Turno fechado");
      setCloseOpen(false);
      setCounted("");
      setNotes("");
      qc.invalidateQueries({
        queryKey: ["my-cash-sessions"]
      });
    },
    onError: (e) => toast.error("Falha ao fechar", {
      description: e.message
    })
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    active ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-emerald-500/40 bg-emerald-500/5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "h-5 w-5 text-emerald-600" }),
          " Turno aberto"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Aberto em ",
          formatDateTime(active.opened_at)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Abertura", value: formatMZN(Number(active.opening_amount)), icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleArrowUp, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Vendas em numerário", value: formatMZN(liveTotals.data?.cash ?? 0), icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Vendas digitais", value: formatMZN(liveTotals.data?.other ?? 0), icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleArrowDown, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Esperado em caixa", value: formatMZN(liveTotals.data?.expected ?? Number(active.opening_amount)), highlight: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => {
          setCounted(String(liveTotals.data?.expected ?? 0));
          setCloseOpen(true);
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "mr-2 h-4 w-4" }),
          " Fechar turno"
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-5 w-5" }),
          " Abrir turno"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Conte o valor inicial na gaveta para começar a registar vendas." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Valor de abertura (MT)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", step: "0.01", value: openAmt, onChange: (e) => setOpenAmt(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => openMut.mutate(), disabled: openMut.isPending, children: [
          openMut.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "mr-2 h-4 w-4" }),
          "Abrir turno"
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-5 w-5" }),
        " Os meus turnos"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: sessions.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Aberto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Fechado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Abertura" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Esperado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Contado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Diferença" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Estado" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: sessions.data?.map((s) => {
          const diff = s.difference ?? 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs", children: formatDateTime(s.opened_at) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs", children: s.closed_at ? formatDateTime(s.closed_at) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: formatMZN(Number(s.opening_amount)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: s.expected_amount != null ? formatMZN(Number(s.expected_amount)) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: s.counted_amount != null ? formatMZN(Number(s.counted_amount)) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: `text-right ${diff < 0 ? "text-destructive" : diff > 0 ? "text-emerald-600" : ""}`, children: s.closed_at ? formatMZN(diff) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: s.status === "open" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-emerald-600/15 text-emerald-700", children: "Aberto" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Fechado" }) })
          ] }, s.id);
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: closeOpen, onOpenChange: setCloseOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Fechar turno" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border bg-muted/30 p-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Esperado em caixa" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatMZN(liveTotals.data?.expected ?? 0) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Vendas: ",
              liveTotals.data?.count ?? 0
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "numerário ",
              formatMZN(liveTotals.data?.cash ?? 0)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Valor contado na gaveta (MT)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", step: "0.01", value: counted, onChange: (e) => setCounted(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Notas (opcional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2 })
        ] }),
        counted && Number(counted) !== (liveTotals.data?.expected ?? 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-600" }),
          "Diferença de ",
          formatMZN(Number(counted) - (liveTotals.data?.expected ?? 0))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => setCloseOpen(false), children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => closeMut.mutate(), disabled: closeMut.isPending, children: [
          closeMut.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
          " Confirmar fecho"
        ] })
      ] })
    ] }) })
  ] });
}
function Stat({
  label,
  value,
  icon,
  highlight
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-md border p-3 ${highlight ? "border-emerald-500/40 bg-emerald-500/10" : "bg-card"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
      icon,
      label
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-semibold", children: value })
  ] });
}
export {
  CaixaPage as component
};
