import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, TrendingDown, ShoppingCart, Loader2, Percent, Wallet } from "lucide-react";
import { getStatsBundle } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { formatMZN } from "@/lib/format";

import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/estatisticas")({
  head: () => ({ meta: [{ title: "Estatísticas — PharmaSys" }] }),
  component: () => <RoleGate allow={["admin", "pharmacist"]}><EstatisticasPage /></RoleGate>,
});


type Range = "7" | "30" | "90";

const RANGE_LABEL: Record<Range, string> = { "7": "7 dias", "30": "30 dias", "90": "90 dias" };

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Numerário", debit: "Cartão", credit: "Crédito", pix: "M-Pesa", other: "e-Mola", bank_transfer: "Transferência",
  mpesa: "M-Pesa", emola: "e-Mola", bank: "Transferência Bancária",
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function EstatisticasPage() {
  const [range, setRange] = useState<Range>("30");
  const days = Number(range);

  const { data, isLoading } = useQuery({
    queryKey: ["stats", range],
    queryFn: async () => {
      const now = Date.now();
      const bundle = await getStatsBundle(days);
      const salesRows = bundle.sales;
      const itemsRows = bundle.items;
      const productMap = new Map(bundle.products.map((p) => [p.id, p]));
      const categoryMap = new Map(bundle.categories.map((c) => [c.id, c.name]));
      const profileMap = new Map(bundle.profiles.map((p) => [p.id, p.full_name ?? p.email ?? "—"]));

      // Daily series
      const byDay = new Map<string, number>();
      const byPayment = new Map<string, number>();
      const byOperator = new Map<string, { total: number; count: number }>();
      for (const s of salesRows) {
        const d = new Date(s.created_at).toISOString().slice(0, 10);
        byDay.set(d, (byDay.get(d) ?? 0) + Number(s.total));
        byPayment.set(s.payment_method, (byPayment.get(s.payment_method) ?? 0) + Number(s.total));
        const opName = profileMap.get(s.user_id) ?? "—";
        const cur = byOperator.get(opName) ?? { total: 0, count: 0 };
        byOperator.set(opName, { total: cur.total + Number(s.total), count: cur.count + 1 });
      }

      // Product / Category / Margin
      const byProduct = new Map<string, { qty: number; total: number; cost: number }>();
      const byCategory = new Map<string, number>();
      let totalRevenue = 0, totalCost = 0;
      for (const it of itemsRows) {
        const prod: any = productMap.get(it.product_id);
        const lineRevenue = Number(it.total);
        const costUnit = prod ? Number(prod.cost_price ?? 0) : 0;
        // Quantity is in pack/sub units; approximate cost: cost_price per pack-unit
        const lineCost = costUnit * it.quantity;
        totalRevenue += lineRevenue;
        totalCost += lineCost;
        const cur = byProduct.get(it.product_name) ?? { qty: 0, total: 0, cost: 0 };
        byProduct.set(it.product_name, { qty: cur.qty + it.quantity, total: cur.total + lineRevenue, cost: cur.cost + lineCost });
        const catName = prod && prod.category_id ? (categoryMap.get(prod.category_id) ?? "Sem categoria") : "Sem categoria";
        byCategory.set(catName, (byCategory.get(catName) ?? 0) + lineRevenue);
      }

      const top = [...byProduct.entries()]
        .map(([name, v]) => ({ name, qty: v.qty, total: v.total, margin: v.total - v.cost }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Fill missing days
      const series: Array<{ date: string; total: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now - i * 86400_000).toISOString().slice(0, 10);
        series.push({ date: d.slice(5), total: Math.round((byDay.get(d) ?? 0) * 100) / 100 });
      }

      const categoriesArr = [...byCategory.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
      const operatorsArr = [...byOperator.entries()].map(([name, v]) => ({ name, total: v.total, count: v.count })).sort((a, b) => b.total - a.total);
      const paymentsArr = [...byPayment.entries()].map(([k, total]) => ({ method: PAYMENT_LABEL[k] ?? k, total }));

      const grossRevenue = salesRows.reduce((s, x) => s + Number(x.total), 0);
      const prevRevenue = bundle.prevSales.reduce((s, x) => s + Number(x.total), 0);
      const variation = prevRevenue > 0 ? ((grossRevenue - prevRevenue) / prevRevenue) * 100 : null;
      const margin = totalRevenue - totalCost;
      const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

      return {
        series, categoriesArr, operatorsArr, paymentsArr, top,
        grossRevenue, prevRevenue, variation,
        margin, marginPct, count: salesRows.length,
        avgTicket: salesRows.length ? grossRevenue / salesRows.length : 0,
      };
    },
  });

  const tickPercent = useMemo(() => (data?.variation != null ? data.variation.toFixed(1) : null), [data]);

  if (isLoading || !data) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Estatísticas de vendas</h2>
          <p className="text-sm text-muted-foreground">Período: últimos {RANGE_LABEL[range]} · comparado com período anterior.</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="7">7 dias</TabsTrigger>
            <TabsTrigger value="30">30 dias</TabsTrigger>
            <TabsTrigger value="90">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard icon={<TrendingUp className="h-4 w-4 text-primary" />} label="Receita" value={formatMZN(data.grossRevenue)} sub={
          tickPercent != null ? (
            <span className={Number(tickPercent) >= 0 ? "text-emerald-600" : "text-destructive"}>
              {Number(tickPercent) >= 0 ? "▲" : "▼"} {Math.abs(Number(tickPercent))}% vs período anterior
            </span>
          ) : <span className="text-muted-foreground">sem comparativo</span>
        } />
        <KpiCard icon={<ShoppingCart className="h-4 w-4 text-primary" />} label="Vendas" value={String(data.count)} />
        <KpiCard icon={<BarChart3 className="h-4 w-4 text-primary" />} label="Ticket médio" value={formatMZN(data.avgTicket)} />
        <KpiCard icon={<Wallet className="h-4 w-4 text-emerald-600" />} label="Margem bruta" value={formatMZN(data.margin)} />
        <KpiCard icon={<Percent className="h-4 w-4 text-emerald-600" />} label="% margem" value={`${data.marginPct.toFixed(1)}%`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Receita diária</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `${v}`} />
              <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top produtos (receita)</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top} layout="vertical" margin={{ left: 90 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="name" width={160} className="text-xs" />
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
                <Legend />
                <Bar dataKey="total" name="Receita" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="margin" name="Margem" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Receita por categoria</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categoriesArr} dataKey="total" nameKey="name" outerRadius={110} label={(p: any) => `${p.name}`}>
                  {data.categoriesArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Desempenho por operador</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.operatorsArr}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
                <Bar dataKey="total" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Forma de pagamento</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.paymentsArr}>
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
    </div>
  );
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <div className="mt-1 text-xs">{sub}</div>}
      </CardContent>
    </Card>
  );
}
