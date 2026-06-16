import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Bell, Layers, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const PAY_LABEL: Record<string, string> = { cash: "Dinheiro", debit: "Débito", credit: "Crédito", pix: "PIX", other: "Outro" };
const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const since14 = new Date(Date.now() - 14 * 86400000);

      const [todaySales, monthSales, productCount, lowStock, alerts, expiringBatches, recentSales] = await Promise.all([
        supabase.from("sales").select("total, id").eq("status", "completed").gte("created_at", today.toISOString()),
        supabase.from("sales").select("total, id").eq("status", "completed").gte("created_at", monthStart.toISOString()),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("alerts").select("id", { count: "exact", head: true }).eq("type", "low_stock").eq("resolved", false),
        supabase.from("alerts").select("*").eq("resolved", false).order("severity", { ascending: false }).limit(8),
        supabase.from("batches").select("*, products(name)").gt("quantity", 0).lte("expiry_date", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).order("expiry_date").limit(5),
        supabase.from("sales").select("total, payment_method, created_at").eq("status", "completed").gte("created_at", since14.toISOString()),
      ]);

      const todayTotal = (todaySales.data ?? []).reduce((s: number, r: { total: number | string }) => s + Number(r.total), 0);
      const monthTotal = (monthSales.data ?? []).reduce((s: number, r: { total: number | string }) => s + Number(r.total), 0);

      // Series últimos 14 dias
      const series: { day: string; total: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const total = (recentSales.data ?? []).filter((s: { created_at: string }) => {
          const t = new Date(s.created_at); return t >= d && t < next;
        }).reduce((sum: number, s: { total: number | string }) => sum + Number(s.total), 0);
        series.push({ day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total: Math.round(total * 100) / 100 });
      }

      // Pagamentos
      const payMap = new Map<string, number>();
      (recentSales.data ?? []).forEach((s: { payment_method: string; total: number | string }) => {
        payMap.set(s.payment_method, (payMap.get(s.payment_method) ?? 0) + Number(s.total));
      });
      const payments = Array.from(payMap.entries()).map(([k, v]) => ({ name: PAY_LABEL[k] ?? k, value: Math.round(v * 100) / 100 }));

      return {
        todayCount: todaySales.data?.length ?? 0,
        todayTotal,
        monthCount: monthSales.data?.length ?? 0,
        monthTotal,
        productCount: productCount.count ?? 0,
        lowStockCount: lowStock.count ?? 0,
        alerts: alerts.data ?? [],
        expiring: expiringBatches.data ?? [],
        series,
        payments,
      };
    },
  });

  const stats = [
    { icon: ShoppingCart, label: "Vendas hoje", value: data?.todayCount ?? 0, sub: formatCurrency(data?.todayTotal ?? 0), color: "text-primary bg-primary/10" },
    { icon: TrendingUp, label: "Vendas no mês", value: data?.monthCount ?? 0, sub: formatCurrency(data?.monthTotal ?? 0), color: "text-success bg-success/10" },
    { icon: Package, label: "Produtos ativos", value: data?.productCount ?? 0, sub: "no catálogo", color: "text-chart-5 bg-chart-5/10" },
    { icon: AlertTriangle, label: "Estoque baixo", value: data?.lowStockCount ?? 0, sub: "alertas ativos", color: "text-warning bg-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da farmácia</p>
        </div>
        <Button asChild><Link to="/pdv">Nova venda</Link></Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1 tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Vendas — últimos 14 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.series ?? []}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-success" /> Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.payments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem vendas no período.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.payments ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {(data?.payments ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Alertas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {data?.alerts.map((a: { id: string; message: string; severity: string }) => (
                  <li key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/40">
                    <span className="text-sm">{a.message}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.severity === "critical" ? "bg-destructive text-destructive-foreground" :
                      a.severity === "warning" ? "bg-warning text-warning-foreground" :
                      "bg-secondary text-secondary-foreground"
                    }`}>{a.severity}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="link" asChild className="px-0"><Link to="/alerts">Ver todos →</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Lotes vencendo em 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lote próximo do vencimento.</p>
            ) : (
              <ul className="space-y-2">
                {data?.expiring.map((b: { id: string; batch_number: string; expiry_date: string; quantity: number; products: { name: string } | null }) => (
                  <li key={b.id} className="flex items-center justify-between p-3 rounded-md bg-muted/40">
                    <div>
                      <p className="text-sm font-medium">{b.products?.name}</p>
                      <p className="text-xs text-muted-foreground">Lote {b.batch_number} • {b.quantity} un</p>
                    </div>
                    <span className="text-xs text-warning-foreground bg-warning px-2 py-0.5 rounded-full">
                      {new Date(b.expiry_date).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
