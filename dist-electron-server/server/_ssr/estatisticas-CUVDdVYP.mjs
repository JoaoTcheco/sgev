import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { f as formatMZN, H as getStatsBundle } from "./router-DE-fAUtY.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent } from "./card-DQ5v2DYb.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-D_u1EXWn.mjs";
import { R as RoleGate } from "./role-gate-WPjeBQ_g.mjs";
import "../_libs/jsbarcode.mjs";
import { L as LoaderCircle, v as TrendingUp, S as ShoppingCart, C as ChartColumn, W as Wallet, w as Percent } from "../_libs/lucide-react.mjs";
import { R as ResponsiveContainer, L as LineChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, a as Line, B as BarChart, b as Legend, c as Bar, P as PieChart, d as Pie, e as Cell } from "../_libs/recharts.mjs";
import "../_libs/tanstack__query-core.mjs";
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
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "./button-DA2gxxPy.mjs";
import "../_libs/class-variance-authority.mjs";
import "./use-auth-ButDQezc.mjs";
import "../_libs/lodash.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
const RANGE_LABEL = {
  "7": "7 dias",
  "30": "30 dias",
  "90": "90 dias"
};
const PAYMENT_LABEL = {
  cash: "Numerário",
  debit: "Cartão",
  credit: "Crédito",
  pix: "M-Pesa",
  other: "e-Mola",
  bank_transfer: "Transferência",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  bank: "Transferência Bancária"
};
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
function EstatisticasPage() {
  const [range, setRange] = reactExports.useState("30");
  const days = Number(range);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["stats", range],
    queryFn: async () => {
      const now = Date.now();
      const bundle = await getStatsBundle(days);
      const salesRows = bundle.sales;
      const itemsRows = bundle.items;
      const productMap = new Map(bundle.products.map((p) => [p.id, p]));
      const categoryMap = new Map(bundle.categories.map((c) => [c.id, c.name]));
      const profileMap = new Map(bundle.profiles.map((p) => [p.id, p.full_name ?? p.email ?? "—"]));
      const byDay = /* @__PURE__ */ new Map();
      const byPayment = /* @__PURE__ */ new Map();
      const byOperator = /* @__PURE__ */ new Map();
      for (const s of salesRows) {
        const d = new Date(s.created_at).toISOString().slice(0, 10);
        byDay.set(d, (byDay.get(d) ?? 0) + Number(s.total));
        byPayment.set(s.payment_method, (byPayment.get(s.payment_method) ?? 0) + Number(s.total));
        const opName = profileMap.get(s.user_id) ?? "—";
        const cur = byOperator.get(opName) ?? {
          total: 0,
          count: 0
        };
        byOperator.set(opName, {
          total: cur.total + Number(s.total),
          count: cur.count + 1
        });
      }
      const byProduct = /* @__PURE__ */ new Map();
      const byCategory = /* @__PURE__ */ new Map();
      let totalRevenue = 0, totalCost = 0;
      for (const it of itemsRows) {
        const prod = productMap.get(it.product_id);
        const lineRevenue = Number(it.total);
        const costUnit = prod ? Number(prod.cost_price ?? 0) : 0;
        const lineCost = costUnit * it.quantity;
        totalRevenue += lineRevenue;
        totalCost += lineCost;
        const cur = byProduct.get(it.product_name) ?? {
          qty: 0,
          total: 0,
          cost: 0
        };
        byProduct.set(it.product_name, {
          qty: cur.qty + it.quantity,
          total: cur.total + lineRevenue,
          cost: cur.cost + lineCost
        });
        const catName = prod && prod.category_id ? categoryMap.get(prod.category_id) ?? "Sem categoria" : "Sem categoria";
        byCategory.set(catName, (byCategory.get(catName) ?? 0) + lineRevenue);
      }
      const top = [...byProduct.entries()].map(([name, v]) => ({
        name,
        qty: v.qty,
        total: v.total,
        margin: v.total - v.cost
      })).sort((a, b) => b.total - a.total).slice(0, 10);
      const series = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now - i * 864e5).toISOString().slice(0, 10);
        series.push({
          date: d.slice(5),
          total: Math.round((byDay.get(d) ?? 0) * 100) / 100
        });
      }
      const categoriesArr = [...byCategory.entries()].map(([name, total]) => ({
        name,
        total
      })).sort((a, b) => b.total - a.total);
      const operatorsArr = [...byOperator.entries()].map(([name, v]) => ({
        name,
        total: v.total,
        count: v.count
      })).sort((a, b) => b.total - a.total);
      const paymentsArr = [...byPayment.entries()].map(([k, total]) => ({
        method: PAYMENT_LABEL[k] ?? k,
        total
      }));
      const grossRevenue = salesRows.reduce((s, x) => s + Number(x.total), 0);
      const prevRevenue = bundle.prevSales.reduce((s, x) => s + Number(x.total), 0);
      const variation = prevRevenue > 0 ? (grossRevenue - prevRevenue) / prevRevenue * 100 : null;
      const margin = totalRevenue - totalCost;
      const marginPct = totalRevenue > 0 ? margin / totalRevenue * 100 : 0;
      return {
        series,
        categoriesArr,
        operatorsArr,
        paymentsArr,
        top,
        grossRevenue,
        prevRevenue,
        variation,
        margin,
        marginPct,
        count: salesRows.length,
        avgTicket: salesRows.length ? grossRevenue / salesRows.length : 0
      };
    }
  });
  const tickPercent = reactExports.useMemo(() => data?.variation != null ? data.variation.toFixed(1) : null, [data]);
  if (isLoading || !data) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold", children: "Estatísticas de vendas" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Período: últimos ",
          RANGE_LABEL[range],
          " · comparado com período anterior."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tabs, { value: range, onValueChange: (v) => setRange(v), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "7", children: "7 dias" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "30", children: "30 dias" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "90", children: "90 dias" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(KpiCard, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-primary" }), label: "Receita", value: formatMZN(data.grossRevenue), sub: tickPercent != null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: Number(tickPercent) >= 0 ? "text-emerald-600" : "text-destructive", children: [
        Number(tickPercent) >= 0 ? "▲" : "▼",
        " ",
        Math.abs(Number(tickPercent)),
        "% vs período anterior"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "sem comparativo" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KpiCard, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-4 w-4 text-primary" }), label: "Vendas", value: String(data.count) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KpiCard, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "h-4 w-4 text-primary" }), label: "Ticket médio", value: formatMZN(data.avgTicket) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KpiCard, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-4 w-4 text-emerald-600" }), label: "Margem bruta", value: formatMZN(data.margin) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KpiCard, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Percent, { className: "h-4 w-4 text-emerald-600" }), label: "% margem", value: `${data.marginPct.toFixed(1)}%` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Receita diária" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: data.series, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "date", className: "text-xs" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { className: "text-xs", tickFormatter: (v) => `${v}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v) => formatMZN(Number(v)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "total", stroke: "hsl(var(--primary))", strokeWidth: 2.5, dot: false })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Top produtos (receita)" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-80", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: data.top, layout: "vertical", margin: {
          left: 90
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { type: "number", className: "text-xs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { type: "category", dataKey: "name", width: 160, className: "text-xs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v) => formatMZN(Number(v)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "total", name: "Receita", fill: "hsl(var(--primary))", radius: [0, 4, 4, 0] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "margin", name: "Margem", fill: "hsl(var(--chart-2))", radius: [0, 4, 4, 0] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Receita por categoria" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-80", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pie, { data: data.categoriesArr, dataKey: "total", nameKey: "name", outerRadius: 110, label: (p) => `${p.name}`, children: data.categoriesArr.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: PIE_COLORS[i % PIE_COLORS.length] }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v) => formatMZN(Number(v)) })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Desempenho por operador" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: data.operatorsArr, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", className: "text-xs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { className: "text-xs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v) => formatMZN(Number(v)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "total", name: "Receita", fill: "hsl(var(--primary))", radius: [4, 4, 0, 0] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Forma de pagamento" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: data.paymentsArr, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-muted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "method", className: "text-xs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { className: "text-xs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v) => formatMZN(Number(v)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "total", fill: "hsl(var(--accent))", radius: [4, 4, 0, 0] })
        ] }) }) })
      ] })
    ] })
  ] });
}
function KpiCard({
  icon,
  label,
  value,
  sub
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: label }),
      icon
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: value }),
      sub && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs", children: sub })
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(RoleGate, { allow: ["admin", "pharmacist"], children: /* @__PURE__ */ jsxRuntimeExports.jsx(EstatisticasPage, {}) });
export {
  SplitComponent as component
};
