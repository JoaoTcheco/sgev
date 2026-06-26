import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { f as formatMZN, J as getDashboardStats } from "./router-DE-fAUtY.mjs";
import { u as useAuthUser, b as useProfile } from "./use-auth-ButDQezc.mjs";
import "../_libs/jsbarcode.mjs";
import { S as ShoppingCart, v as TrendingUp, T as TriangleAlert, d as Package } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/tanstack__react-router.mjs";
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
function DashboardPage() {
  const {
    user
  } = useAuthUser();
  const {
    data: profile
  } = useProfile(user?.id);
  const {
    data: stats
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-3xl font-bold tracking-tight", children: [
        "Olá, ",
        profile?.full_name?.split(" ")[0] || "bem-vindo",
        " 👋"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Resumo da operação de hoje." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Vendas hoje", value: String(stats?.salesCount ?? 0), subtitle: `${formatMZN(stats?.totalSales ?? 0)} faturado`, icon: ShoppingCart, tone: "primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Ticket médio", value: formatMZN(stats?.ticketMedio ?? 0), subtitle: "Média por venda hoje", icon: TrendingUp, tone: "success" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Alertas activos", value: String(stats?.alertsActive ?? 0), subtitle: `${stats?.alertsCritical ?? 0} críticos`, icon: TriangleAlert, tone: "warning" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Produtos activos", value: String(stats?.productsActive ?? 0), subtitle: "Em catálogo", icon: Package, tone: "muted" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Próximos módulos" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "text-sm text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Esta é a fundação do PharmaSys. Os próximos módulos a serem construídos seguem a ordem da documentação: Vendas (PDV), Estoque com CRUD, Alertas, Estatísticas, Contas, Fornecedores, Utilizadores, Histórico e Relatórios." }) })
    ] })
  ] });
}
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    muted: "bg-muted text-muted-foreground"
  }[tone];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-start justify-between gap-4 p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-semibold tracking-tight", children: value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: subtitle })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) })
  ] }) });
}
export {
  DashboardPage as component
};
