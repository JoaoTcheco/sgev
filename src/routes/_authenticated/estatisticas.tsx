import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3, TrendingUp, ShoppingCart, Loader2, Percent, Wallet, Download,
  Filter, RotateCcw, ArrowUpDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { formatMZN, formatDate } from "@/lib/format";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/estatisticas")({
  head: () => ({ meta: [{ title: "Estatística — PharmaSys" }] }),
  component: () => (
    <RoleGate allow={["admin", "pharmacist"]}>
      <EstatisticaPage />
    </RoleGate>
  ),
});

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Numerário", debit: "Cartão", credit: "Crédito",
  pix: "M-Pesa", other: "e-Mola", bank_transfer: "Transferência",
};
const WEEKDAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

type Preset = "today" | "7" | "30" | "90" | "ytd" | "custom";
type SortKey = "revenue_desc" | "revenue_asc" | "qty_desc" | "qty_asc" | "margin_desc" | "margin_asc";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function EstatisticaPage() {
  // ---------------- Filter state ----------------
  const [preset, setPreset] = useState<Preset>("30");
  const [from, setFrom] = useState<string>(daysAgoISO(30));
  const [to, setTo] = useState<string>(todayISO());
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [weekday, setWeekday] = useState<string>("all");
  const [hourFrom, setHourFrom] = useState<string>("0");
  const [hourTo, setHourTo] = useState<string>("23");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [productSearch, setProductSearch] = useState("");
  const [payment, setPayment] = useState<string>("all");
  const [accountId, setAccountId] = useState<string>("all");
  const [operatorId, setOperatorId] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("revenue_desc");
  const [topN, setTopN] = useState<string>("10");

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p === "today") { setFrom(todayISO()); setTo(todayISO()); }
    else if (p === "7") { setFrom(daysAgoISO(6)); setTo(todayISO()); }
    else if (p === "30") { setFrom(daysAgoISO(29)); setTo(todayISO()); }
    else if (p === "90") { setFrom(daysAgoISO(89)); setTo(todayISO()); }
    else if (p === "ytd") {
      const y = new Date().getFullYear();
      setFrom(`${y}-01-01`); setTo(todayISO());
    }
  }
  function resetAll() {
    applyPreset("30");
    setYear("all"); setMonth("all"); setWeekday("all");
    setHourFrom("0"); setHourTo("23");
    setCategoryId("all"); setProductSearch("");
    setPayment("all"); setAccountId("all"); setOperatorId("all");
    setSort("revenue_desc"); setTopN("10");
  }

  // ---------------- Data load ----------------
  const fromISO = useMemo(() => new Date(from + "T00:00:00").toISOString(), [from]);
  const toISO = useMemo(() => new Date(to + "T23:59:59").toISOString(), [to]);

  const { data: base, isLoading: baseLoading } = useQuery({
    queryKey: ["estat-base"],
    queryFn: async () => {
      const [prods, cats, accs, profs] = await Promise.all([
        supabase.from("products").select("id, name, cost_price, category_id"),
        supabase.from("categories").select("id, name"),
        supabase.from("financial_accounts").select("id, name"),
        supabase.from("profiles").select("id, full_name, email"),
      ]);
      for (const r of [prods, cats, accs, profs]) if (r.error) throw r.error;
      return {
        products: prods.data ?? [],
        categories: cats.data ?? [],
        accounts: accs.data ?? [],
        profiles: profs.data ?? [],
      };
    },
  });

  const { data, isLoading } = useQuery({
    enabled: !!base,
    queryKey: ["estat", fromISO, toISO],
    queryFn: async () => {
      const [sales, items, accMoves] = await Promise.all([
        supabase.from("sales")
          .select("id, total, created_at, payment_method, user_id, status, account_id")
          .gte("created_at", fromISO).lte("created_at", toISO).eq("status", "completed").limit(20000),
        supabase.from("sale_items")
          .select("sale_id, product_id, product_name, quantity, unit_price, total, created_at")
          .gte("created_at", fromISO).lte("created_at", toISO).limit(50000),
        supabase.from("account_movements")
          .select("id, account_id, type, amount, created_at, reference")
          .gte("created_at", fromISO).lte("created_at", toISO).limit(50000),
      ]);
      for (const r of [sales, items, accMoves]) if (r.error) throw r.error;
      return {
        sales: sales.data ?? [],
        items: items.data ?? [],
        accMoves: accMoves.data ?? [],
      };
    },
  });

  // ---------------- Derive available years ----------------
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const s of data?.sales ?? []) set.add(new Date(s.created_at).getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [data]);

  // ---------------- Apply secondary filters ----------------
  const filtered = useMemo(() => {
    if (!data || !base) return null;

    const productMap = new Map(base.products.map((p: any) => [p.id, p]));
    const inCategory = (pid: string) => {
      if (categoryId === "all") return true;
      const p: any = productMap.get(pid);
      return p && p.category_id === categoryId;
    };
    const nameMatch = (name: string) => {
      if (!productSearch.trim()) return true;
      return name.toLowerCase().includes(productSearch.trim().toLowerCase());
    };

    const hFrom = Number(hourFrom), hTo = Number(hourTo);
    const inTemporal = (iso: string) => {
      const d = new Date(iso);
      if (year !== "all" && d.getFullYear() !== Number(year)) return false;
      if (month !== "all" && d.getMonth() + 1 !== Number(month)) return false;
      if (weekday !== "all" && d.getDay() !== Number(weekday)) return false;
      const h = d.getHours();
      if (h < hFrom || h > hTo) return false;
      return true;
    };

    // Filter sales
    const sales = data.sales.filter((s: any) => {
      if (!inTemporal(s.created_at)) return false;
      if (payment !== "all" && s.payment_method !== payment) return false;
      if (accountId !== "all" && s.account_id !== accountId) return false;
      if (operatorId !== "all" && s.user_id !== operatorId) return false;
      return true;
    });
    const saleIdSet = new Set(sales.map((s: any) => s.id));

    // Filter items (respect sale filter + product filters)
    const items = data.items.filter((i: any) => {
      if (!saleIdSet.has(i.sale_id)) return false;
      if (!inCategory(i.product_id)) return false;
      if (!nameMatch(i.product_name)) return false;
      return true;
    });

    // Account movements (respect period + account + temporal + optional operator via reference)
    const accMoves = data.accMoves.filter((m: any) => {
      if (!inTemporal(m.created_at)) return false;
      if (accountId !== "all" && m.account_id !== accountId) return false;
      return true;
    });

    return { sales, items, accMoves };
  }, [data, base, year, month, weekday, hourFrom, hourTo, categoryId, productSearch, payment, accountId, operatorId]);

  // ---------------- Aggregations ----------------
  const agg = useMemo(() => {
    if (!filtered || !base) return null;
    const productMap = new Map(base.products.map((p: any) => [p.id, p]));
    const categoryMap = new Map(base.categories.map((c: any) => [c.id, c.name]));
    const accountMap = new Map(base.accounts.map((a: any) => [a.id, a.name]));
    const profileMap = new Map(base.profiles.map((p: any) => [p.id, p.full_name ?? p.email ?? "—"]));

    // Recompute item-revenue-based totals so filtered items drive the KPIs
    let revenue = 0, cost = 0, qty = 0;
    const byDay = new Map<string, number>();
    const byHour = new Map<number, number>();
    const byWeekday = new Map<number, number>();
    const byMonth = new Map<string, number>();
    const byPayment = new Map<string, number>();
    const byOperator = new Map<string, { total: number; count: number }>();
    const byCategory = new Map<string, number>();
    const byProduct = new Map<string, { qty: number; revenue: number; cost: number; product_id: string }>();

    // sales-level breakdowns
    for (const s of filtered.sales) {
      const d = new Date(s.created_at);
      const dayKey = d.toISOString().slice(0, 10);
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + Number(s.total));
      byHour.set(d.getHours(), (byHour.get(d.getHours()) ?? 0) + Number(s.total));
      byWeekday.set(d.getDay(), (byWeekday.get(d.getDay()) ?? 0) + Number(s.total));
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(mk, (byMonth.get(mk) ?? 0) + Number(s.total));
      byPayment.set(s.payment_method, (byPayment.get(s.payment_method) ?? 0) + Number(s.total));
      const opName = profileMap.get(s.user_id) ?? "—";
      const cur = byOperator.get(opName) ?? { total: 0, count: 0 };
      byOperator.set(opName, { total: cur.total + Number(s.total), count: cur.count + 1 });
    }

    // item-level breakdowns
    for (const it of filtered.items) {
      const p: any = productMap.get(it.product_id);
      const lineRev = Number(it.total);
      const lineCost = (p ? Number(p.cost_price ?? 0) : 0) * Number(it.quantity);
      revenue += lineRev; cost += lineCost; qty += Number(it.quantity);
      const catName = p && p.category_id ? (categoryMap.get(p.category_id) ?? "Sem categoria") : "Sem categoria";
      byCategory.set(catName, (byCategory.get(catName) ?? 0) + lineRev);
      const cur = byProduct.get(it.product_name) ?? { qty: 0, revenue: 0, cost: 0, product_id: it.product_id };
      byProduct.set(it.product_name, {
        qty: cur.qty + Number(it.quantity),
        revenue: cur.revenue + lineRev,
        cost: cur.cost + lineCost,
        product_id: it.product_id,
      });
    }

    // Account movement aggregations
    const accountAgg = new Map<string, { credit: number; debit: number; count: number }>();
    for (const m of filtered.accMoves) {
      const key = accountMap.get(m.account_id) ?? m.account_id;
      const cur = accountAgg.get(key) ?? { credit: 0, debit: 0, count: 0 };
      const amt = Number(m.amount);
      if (m.type === "credit") cur.credit += amt;
      else if (m.type === "debit") cur.debit += amt;
      cur.count += 1;
      accountAgg.set(key, cur);
    }

    // Build sorted product list
    const productList = [...byProduct.entries()].map(([name, v]) => ({
      name, qty: v.qty, revenue: v.revenue, margin: v.revenue - v.cost,
      marginPct: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0,
    }));
    const sorters: Record<SortKey, (a: any, b: any) => number> = {
      revenue_desc: (a, b) => b.revenue - a.revenue,
      revenue_asc: (a, b) => a.revenue - b.revenue,
      qty_desc: (a, b) => b.qty - a.qty,
      qty_asc: (a, b) => a.qty - b.qty,
      margin_desc: (a, b) => b.margin - a.margin,
      margin_asc: (a, b) => a.margin - b.margin,
    };
    productList.sort(sorters[sort]);
    const N = topN === "all" ? productList.length : Number(topN);
    const topProducts = productList.slice(0, N);
    const leastSold = [...productList].sort((a, b) => a.qty - b.qty).slice(0, N);

    // Time series (fill days between from/to)
    const series: Array<{ date: string; total: number }> = [];
    const start = new Date(from + "T00:00:00");
    const end = new Date(to + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      series.push({ date: key.slice(5), total: Math.round((byDay.get(key) ?? 0) * 100) / 100 });
    }

    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}h`, total: byHour.get(h) ?? 0 }));
    const weekly = WEEKDAY.map((n, i) => ({ day: n, total: byWeekday.get(i) ?? 0 }));
    const monthly = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ month: k, total: v }));
    const categoriesArr = [...byCategory.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
    const operatorsArr = [...byOperator.entries()].map(([name, v]) => ({ name, total: v.total, count: v.count })).sort((a, b) => b.total - a.total);
    const paymentsArr = [...byPayment.entries()].map(([k, total]) => ({ method: PAYMENT_LABEL[k] ?? k, total }));
    const accountsArr = [...accountAgg.entries()]
      .map(([name, v]) => ({ name, credit: v.credit, debit: v.debit, net: v.credit - v.debit, count: v.count }))
      .sort((a, b) => b.count - a.count);

    return {
      revenue, cost, margin: revenue - cost,
      marginPct: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
      qty, salesCount: filtered.sales.length,
      avgTicket: filtered.sales.length ? revenue / filtered.sales.length : 0,
      topProducts, leastSold,
      series, hourly, weekly, monthly,
      categoriesArr, operatorsArr, paymentsArr, accountsArr,
    };
  }, [filtered, base, sort, topN, from, to]);

  function exportCSV() {
    if (!agg) return;
    const rows: string[] = ["Produto;Quantidade;Receita;Margem;% Margem"];
    for (const p of agg.topProducts) {
      rows.push(`${p.name};${p.qty};${p.revenue.toFixed(2)};${p.margin.toFixed(2)};${p.marginPct.toFixed(1)}%`);
    }
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estatistica-${formatDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (baseLoading || isLoading || !agg || !base) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Estatística</h2>
          <p className="text-sm text-muted-foreground">
            Filtros combinados sobre vendas, produtos, contas e operadores — dados em tempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetAll}><RotateCcw className="mr-2 h-4 w-4" />Repor</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>
        </div>
      </div>

      {/* ---------------- FILTER PANEL ---------------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" />Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={preset} onValueChange={(v) => applyPreset(v as Preset)}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="7">7 dias</TabsTrigger>
              <TabsTrigger value="30">30 dias</TabsTrigger>
              <TabsTrigger value="90">90 dias</TabsTrigger>
              <TabsTrigger value="ytd">Ano actual</TabsTrigger>
              <TabsTrigger value="custom">Personalizado</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }} />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("custom"); }} />
            </div>
            <div>
              <Label className="text-xs">Ano</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mês</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Dia da semana</Label>
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {WEEKDAY.map((n, i) => <SelectItem key={n} value={String(i)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Hora de</Label>
                <Select value={hourFrom} onValueChange={setHourFrom}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, h) => <SelectItem key={h} value={String(h)}>{String(h).padStart(2, "0")}h</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">até</Label>
                <Select value={hourTo} onValueChange={setHourTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, h) => <SelectItem key={h} value={String(h)}>{String(h).padStart(2, "0")}h</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {base.categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Pesquisar produto</Label>
              <Input placeholder="Nome do medicamento" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Pagamento</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(PAYMENT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Conta</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {base.accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Operador</Label>
              <Select value={operatorId} onValueChange={setOperatorId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {base.profiles.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email ?? "—"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Ordenar</Label>
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue_desc">Receita ↓</SelectItem>
                    <SelectItem value="revenue_asc">Receita ↑</SelectItem>
                    <SelectItem value="qty_desc">Quantidade ↓</SelectItem>
                    <SelectItem value="qty_asc">Quantidade ↑</SelectItem>
                    <SelectItem value="margin_desc">Margem ↓</SelectItem>
                    <SelectItem value="margin_asc">Margem ↑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Top</Label>
                <Select value={topN} onValueChange={setTopN}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="all">Tudo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{formatDate(from)} → {formatDate(to)}</Badge>
            {year !== "all" && <Badge variant="outline">Ano: {year}</Badge>}
            {month !== "all" && <Badge variant="outline">Mês: {MONTHS[Number(month) - 1]}</Badge>}
            {weekday !== "all" && <Badge variant="outline">Dia: {WEEKDAY[Number(weekday)]}</Badge>}
            <Badge variant="outline">Hora {hourFrom}h–{hourTo}h</Badge>
            {categoryId !== "all" && <Badge variant="outline">Categoria</Badge>}
            {productSearch && <Badge variant="outline">"{productSearch}"</Badge>}
            {payment !== "all" && <Badge variant="outline">{PAYMENT_LABEL[payment]}</Badge>}
            {accountId !== "all" && <Badge variant="outline">Conta</Badge>}
            {operatorId !== "all" && <Badge variant="outline">Operador</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* ---------------- KPIs ---------------- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={<TrendingUp className="h-4 w-4 text-primary" />} label="Receita" value={formatMZN(agg.revenue)} />
        <Kpi icon={<ShoppingCart className="h-4 w-4 text-primary" />} label="Vendas" value={String(agg.salesCount)} />
        <Kpi icon={<BarChart3 className="h-4 w-4 text-primary" />} label="Ticket médio" value={formatMZN(agg.avgTicket)} />
        <Kpi icon={<Wallet className="h-4 w-4 text-emerald-600" />} label="Margem" value={formatMZN(agg.margin)} />
        <Kpi icon={<Percent className="h-4 w-4 text-emerald-600" />} label="% margem" value={`${agg.marginPct.toFixed(1)}%`} />
        <Kpi icon={<ArrowUpDown className="h-4 w-4 text-primary" />} label="Unidades vendidas" value={String(agg.qty)} />
      </div>

      {/* ---------------- Charts ---------------- */}
      <Card>
        <CardHeader><CardTitle>Receita diária</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={agg.series}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Por hora do dia</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agg.hourly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Por dia da semana</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agg.weekly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
                <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {agg.monthly.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Por mês</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agg.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ---------------- Products ---------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Medicamentos mais vendidos</CardTitle></CardHeader>
          <CardContent>
            {agg.topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sem dados para os filtros seleccionados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agg.topProducts.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.qty}</TableCell>
                      <TableCell className="text-right">{formatMZN(p.revenue)}</TableCell>
                      <TableCell className="text-right">{formatMZN(p.margin)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Menos vendidos (no período)</CardTitle></CardHeader>
          <CardContent>
            {agg.leastSold.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agg.leastSold.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.qty}</TableCell>
                      <TableCell className="text-right">{formatMZN(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Categories / Payments / Operators ---------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Receita por categoria</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={agg.categoriesArr} dataKey="total" nameKey="name" outerRadius={100} label={(p: any) => p.name}>
                  {agg.categoriesArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Forma de pagamento</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agg.paymentsArr}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="method" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
                <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Desempenho por operador</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agg.operatorsArr}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
                <Legend />
                <Bar dataKey="total" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contas — movimento no período</CardTitle></CardHeader>
          <CardContent>
            {agg.accountsArr.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sem movimentos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Movimentos</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Saídas</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agg.accountsArr.map((a) => (
                    <TableRow key={a.name}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-right">{a.count}</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatMZN(a.credit)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatMZN(a.debit)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatMZN(a.net)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
